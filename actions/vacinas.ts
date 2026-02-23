"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { vacinaSchema } from "@/schemas/vacina";

export async function createVacinaAction(input: unknown) {
  const parsed = vacinaSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("vacinas").insert({
    workspace_id: profile.workspace_id,
    pet_id: parsed.data.pet_id,
    atendimento_id: parsed.data.atendimento_id ?? null,
    nome: parsed.data.nome,
    lote: parsed.data.lote || null,
    fabricante: parsed.data.fabricante || null,
    data_aplicacao: parsed.data.data_aplicacao,
    proxima_dose: parsed.data.proxima_dose || null,
    observacoes: parsed.data.observacoes || null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/vacinas");
  return { ok: true, message: "Vacina criada" };
}

export async function updateVacinaAction(input: unknown) {
  const parsed = vacinaSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("vacinas")
    .update({
      pet_id: rest.pet_id,
      atendimento_id: rest.atendimento_id ?? null,
      nome: rest.nome,
      lote: rest.lote || null,
      fabricante: rest.fabricante || null,
      data_aplicacao: rest.data_aplicacao,
      proxima_dose: rest.proxima_dose || null,
      observacoes: rest.observacoes || null
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/vacinas");
  revalidatePath(`/vacinas/${id}`);
  return { ok: true, message: "Vacina atualizada" };
}

export async function deleteVacinaAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("vacinas").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/vacinas");
  return { ok: true, message: "Vacina removida" };
}
