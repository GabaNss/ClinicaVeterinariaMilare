import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { Financeiro } from "@/lib/types/db";

const fields = "id, workspace_id, atendimento_id, tutor_id, pet_id, tipo, categoria, descricao, valor, data_competencia, status, data_pagamento, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listFinanceiro = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("financeiro").select(fields).is("deleted_at", null).order("data_competencia", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Financeiro[];
});

export const getFinanceiroById = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("financeiro").select(fields).eq("id", id).is("deleted_at", null).single();
  if (error) throw new Error(error.message);
  return data as Financeiro;
});
