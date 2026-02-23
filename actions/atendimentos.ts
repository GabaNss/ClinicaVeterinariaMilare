"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { atendimentoSchema } from "@/schemas/atendimento";

export async function createAtendimentoAction(input: unknown) {
  const parsed = atendimentoSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("atendimentos").insert({
    workspace_id: profile.workspace_id,
    tutor_id: parsed.data.tutor_id,
    pet_id: parsed.data.pet_id,
    veterinario_id: parsed.data.veterinario_id,
    agenda_id: parsed.data.agenda_id ?? null,
    queixa_principal: parsed.data.queixa_principal || null,
    anamnese: parsed.data.anamnese || null,
    diagnostico: parsed.data.diagnostico || null,
    conduta: parsed.data.conduta || null,
    prescricao: parsed.data.prescricao || null,
    retorno_em: parsed.data.retorno_em || null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/atendimentos");
  return { ok: true, message: "Atendimento criado" };
}

export async function updateAtendimentoAction(input: unknown) {
  const parsed = atendimentoSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("atendimentos")
    .update({
      tutor_id: rest.tutor_id,
      pet_id: rest.pet_id,
      veterinario_id: rest.veterinario_id,
      agenda_id: rest.agenda_id ?? null,
      queixa_principal: rest.queixa_principal || null,
      anamnese: rest.anamnese || null,
      diagnostico: rest.diagnostico || null,
      conduta: rest.conduta || null,
      prescricao: rest.prescricao || null,
      retorno_em: rest.retorno_em || null
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/atendimentos");
  revalidatePath(`/atendimentos/${id}`);
  return { ok: true, message: "Atendimento atualizado" };
}

export async function deleteAtendimentoAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("atendimentos").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/atendimentos");
  return { ok: true, message: "Atendimento removido" };
}
