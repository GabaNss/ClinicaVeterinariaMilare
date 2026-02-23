"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { financeiroSchema } from "@/schemas/financeiro";

export async function createFinanceiroAction(input: unknown) {
  const parsed = financeiroSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("financeiro").insert({
    workspace_id: profile.workspace_id,
    atendimento_id: parsed.data.atendimento_id ?? null,
    tutor_id: parsed.data.tutor_id,
    pet_id: parsed.data.pet_id ?? null,
    tipo: parsed.data.tipo,
    categoria: parsed.data.categoria,
    descricao: parsed.data.descricao || null,
    valor: parsed.data.valor,
    data_competencia: parsed.data.data_competencia,
    status: parsed.data.status,
    data_pagamento: parsed.data.data_pagamento || null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro");
  return { ok: true, message: "Lancamento criado" };
}

export async function updateFinanceiroAction(input: unknown) {
  const parsed = financeiroSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("financeiro")
    .update({
      atendimento_id: rest.atendimento_id ?? null,
      tutor_id: rest.tutor_id,
      pet_id: rest.pet_id ?? null,
      tipo: rest.tipo,
      categoria: rest.categoria,
      descricao: rest.descricao || null,
      valor: rest.valor,
      data_competencia: rest.data_competencia,
      status: rest.status,
      data_pagamento: rest.data_pagamento || null
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro");
  revalidatePath(`/financeiro/${id}`);
  return { ok: true, message: "Lancamento atualizado" };
}

export async function deleteFinanceiroAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO"]);
  const { error } = await supabase.from("financeiro").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro");
  return { ok: true, message: "Lancamento removido" };
}
