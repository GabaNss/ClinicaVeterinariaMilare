"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { estoqueSchema } from "@/schemas/estoque";

function nullableNumber(value: number | string | undefined) {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createEstoqueAction(input: unknown) {
  const parsed = estoqueSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("estoque_itens").insert({
    workspace_id: profile.workspace_id,
    nome: parsed.data.nome,
    categoria: parsed.data.categoria || null,
    sku: parsed.data.sku || null,
    unidade: parsed.data.unidade,
    quantidade_atual: parsed.data.quantidade_atual,
    quantidade_minima: parsed.data.quantidade_minima,
    custo_medio: nullableNumber(parsed.data.custo_medio),
    valor_venda: nullableNumber(parsed.data.valor_venda),
    validade: parsed.data.validade || null,
    lote: parsed.data.lote || null,
    fornecedor: parsed.data.fornecedor || null,
    observacoes: parsed.data.observacoes || null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/estoque");
  return { ok: true, message: "Item criado no estoque" };
}

export async function updateEstoqueAction(input: unknown) {
  const parsed = estoqueSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("estoque_itens")
    .update({
      nome: rest.nome,
      categoria: rest.categoria || null,
      sku: rest.sku || null,
      unidade: rest.unidade,
      quantidade_atual: rest.quantidade_atual,
      quantidade_minima: rest.quantidade_minima,
      custo_medio: nullableNumber(rest.custo_medio),
      valor_venda: nullableNumber(rest.valor_venda),
      validade: rest.validade || null,
      lote: rest.lote || null,
      fornecedor: rest.fornecedor || null,
      observacoes: rest.observacoes || null
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/estoque");
  return { ok: true, message: "Item atualizado" };
}

export async function deleteEstoqueAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("estoque_itens").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/estoque");
  return { ok: true, message: "Item removido" };
}
