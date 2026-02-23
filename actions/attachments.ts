"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { attachmentSchema } from "@/schemas/attachment";

export async function createAttachmentAction(input: unknown) {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("atendimento_attachments").insert({
    workspace_id: profile.workspace_id,
    atendimento_id: parsed.data.atendimento_id,
    file_name: parsed.data.file_name,
    file_path: parsed.data.file_path,
    mime_type: parsed.data.mime_type || null,
    size_bytes: parsed.data.size_bytes ?? null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/atendimentos/${parsed.data.atendimento_id}`);
  return { ok: true, message: "Anexo registrado" };
}

export async function softDeleteAttachmentAction(input: { id: string; atendimento_id: string }) {
  const parsed = z.object({ id: z.string().uuid(), atendimento_id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { data: existing, error: findError } = await supabase
    .from("atendimento_attachments")
    .select("file_path")
    .eq("id", parsed.data.id)
    .eq("atendimento_id", parsed.data.atendimento_id)
    .is("deleted_at", null)
    .single();
  if (findError || !existing) return { ok: false, message: findError?.message ?? "Anexo nao encontrado" };

  const { error: storageError } = await supabase.storage.from("atendimento-anexos").remove([existing.file_path]);
  if (storageError) return { ok: false, message: storageError.message };

  const { error } = await supabase.from("atendimento_attachments").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/atendimentos/${parsed.data.atendimento_id}`);
  return { ok: true, message: "Anexo removido" };
}

export async function uploadAttachmentAction(formData: FormData) {
  const atendimentoId = String(formData.get("atendimento_id") ?? "");
  const file = formData.get("file");

  if (!atendimentoId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Arquivo invalido" };
  }

  const { supabase, user, profile } = await requireRole(["ADMIN", "VETERINARIO"]);
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExt = (ext ?? "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
  const path = `${profile.workspace_id}/${atendimentoId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from("atendimento-anexos").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { error: insertError } = await supabase.from("atendimento_attachments").insert({
    workspace_id: profile.workspace_id,
    atendimento_id: atendimentoId,
    file_name: file.name,
    file_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    created_by: user.id,
    created_by_name: profile.full_name ?? "Usuario"
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath(`/atendimentos/${atendimentoId}`);
  return { ok: true, message: "Arquivo enviado" };
}
