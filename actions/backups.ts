"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";

type ActionError = { ok: false; message: string };
type ActionSuccess = { ok: true; message: string };
type DownloadSuccess = { ok: true; fileName: string; checksum: string; content: string };
type DownloadResult = ActionError | DownloadSuccess;
type RestoreSuccess = { ok: true; message: string; restored: Record<string, number> };
type RestoreResult = ActionError | RestoreSuccess;

function formatDateForFile(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const mi = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export async function createWorkspaceBackupAction(): Promise<ActionError | ActionSuccess> {
  const { supabase, profile, user } = await requireRole(["ADMIN"]);

  const [workspaceRes, profilesRes, tutoresRes, petsRes, agendaRes, atendimentosRes, vacinasRes, financeiroRes, estoqueRes, attachmentsRes, auditRes] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", profile.workspace_id).single(),
    supabase.from("profiles").select("*").eq("workspace_id", profile.workspace_id).order("created_at", { ascending: true }),
    supabase.from("tutores").select("*").eq("workspace_id", profile.workspace_id).order("updated_at", { ascending: false }),
    supabase.from("pets").select("*").eq("workspace_id", profile.workspace_id).order("updated_at", { ascending: false }),
    supabase.from("agenda").select("*").eq("workspace_id", profile.workspace_id).order("data_hora", { ascending: true }),
    supabase.from("atendimentos").select("*").eq("workspace_id", profile.workspace_id).order("updated_at", { ascending: false }),
    supabase.from("vacinas").select("*").eq("workspace_id", profile.workspace_id).order("data_aplicacao", { ascending: false }),
    supabase.from("financeiro").select("*").eq("workspace_id", profile.workspace_id).order("data_competencia", { ascending: false }),
    supabase.from("estoque_itens").select("*").eq("workspace_id", profile.workspace_id).order("nome", { ascending: true }),
    supabase.from("atendimento_attachments").select("*").eq("workspace_id", profile.workspace_id).order("created_at", { ascending: false }),
    supabase.from("audit_log").select("*").eq("workspace_id", profile.workspace_id).order("created_at", { ascending: false }).limit(5000)
  ]);

  const error = workspaceRes.error ?? profilesRes.error ?? tutoresRes.error ?? petsRes.error ?? agendaRes.error ?? atendimentosRes.error ?? vacinasRes.error ?? financeiroRes.error ?? estoqueRes.error ?? attachmentsRes.error ?? auditRes.error;
  if (error) {
    return { ok: false, message: error.message };
  }

  const generatedAt = new Date();
  const payload = {
    meta: {
      workspace_id: profile.workspace_id,
      generated_at: generatedAt.toISOString(),
      generated_by: user.id,
      version: 1
    },
    workspace: workspaceRes.data,
    tables: {
      profiles: profilesRes.data ?? [],
      tutores: tutoresRes.data ?? [],
      pets: petsRes.data ?? [],
      agenda: agendaRes.data ?? [],
      atendimentos: atendimentosRes.data ?? [],
      vacinas: vacinasRes.data ?? [],
      financeiro: financeiroRes.data ?? [],
      estoque_itens: estoqueRes.data ?? [],
      atendimento_attachments: attachmentsRes.data ?? [],
      audit_log: auditRes.data ?? []
    }
  };

  const serialized = JSON.stringify(payload);
  const checksum = createHash("sha256").update(serialized).digest("hex");
  const fileName = `backup-${formatDateForFile(generatedAt)}.json`;

  const { error: insertError } = await supabase.from("workspace_backups").insert({
    workspace_id: profile.workspace_id,
    file_name: fileName,
    checksum_sha256: checksum,
    payload,
    created_by: user.id
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Backup gerado com sucesso" };
}

export async function downloadWorkspaceBackupAction(input: unknown): Promise<DownloadResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Backup invalido" };

  const { supabase } = await requireRole(["ADMIN"]);
  const { data, error } = await supabase
    .from("workspace_backups")
    .select("id, file_name, checksum_sha256, payload, created_at")
    .eq("id", parsed.data.id)
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Backup nao encontrado" };
  }

  return {
    ok: true,
    fileName: data.file_name,
    checksum: data.checksum_sha256,
    content: JSON.stringify(data.payload, null, 2)
  };
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => !!item && typeof item === "object") as Record<string, unknown>[];
}

function chunk<T>(items: T[], size: number) {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
}

export async function restoreWorkspaceFromUploadAction(formData: FormData): Promise<RestoreResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Arquivo de backup invalido" };
  }

  const { supabase, profile } = await requireRole(["ADMIN"]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { ok: false, message: "Arquivo JSON invalido" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, message: "Formato de backup invalido" };
  }

  const payload = parsed as {
    meta?: { workspace_id?: string };
    tables?: Record<string, unknown>;
  };

  const backupWorkspaceId = payload.meta?.workspace_id;
  if (!backupWorkspaceId || backupWorkspaceId !== profile.workspace_id) {
    return { ok: false, message: "Backup nao pertence ao workspace atual" };
  }

  const tables = payload.tables ?? {};

  const tableMap: Array<{ table: string; rows: Record<string, unknown>[] }> = [
    { table: "tutores", rows: asRows(tables.tutores) },
    { table: "pets", rows: asRows(tables.pets) },
    { table: "agenda", rows: asRows(tables.agenda) },
    { table: "atendimentos", rows: asRows(tables.atendimentos) },
    { table: "vacinas", rows: asRows(tables.vacinas) },
    { table: "financeiro", rows: asRows(tables.financeiro) },
    { table: "estoque_itens", rows: asRows(tables.estoque_itens) },
    { table: "atendimento_attachments", rows: asRows(tables.atendimento_attachments) }
  ];

  const restored: Record<string, number> = {};

  for (const item of tableMap) {
    const normalized = item.rows.map((row) => ({ ...row, workspace_id: profile.workspace_id }));
    if (normalized.length === 0) {
      restored[item.table] = 0;
      continue;
    }

    for (const part of chunk(normalized, 200)) {
      const { error } = await supabase.from(item.table).upsert(part, { onConflict: "id" });
      if (error) {
        return { ok: false, message: `Falha ao restaurar ${item.table}: ${error.message}` };
      }
    }

    restored[item.table] = normalized.length;
  }

  revalidatePath("/dashboard");
  revalidatePath("/tutores");
  revalidatePath("/pets");
  revalidatePath("/agenda");
  revalidatePath("/atendimentos");
  revalidatePath("/vacinas");
  revalidatePath("/financeiro");
  revalidatePath("/estoque");
  revalidatePath("/profile");

  return { ok: true, message: "Backup restaurado com sucesso", restored };
}
