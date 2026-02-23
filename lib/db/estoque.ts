import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { EstoqueItem } from "@/lib/types/db";

const fields = "id, workspace_id, nome, categoria, sku, unidade, quantidade_atual, quantidade_minima, custo_medio, valor_venda, validade, lote, fornecedor, observacoes, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listEstoque = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("estoque_itens").select(fields).is("deleted_at", null).order("nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as EstoqueItem[];
});
