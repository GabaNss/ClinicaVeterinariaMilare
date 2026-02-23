import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { Vacina } from "@/lib/types/db";

const fields = "id, workspace_id, pet_id, atendimento_id, nome, lote, fabricante, data_aplicacao, proxima_dose, observacoes, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listVacinas = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("vacinas").select(fields).is("deleted_at", null).order("data_aplicacao", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Vacina[];
});

export const getVacinaById = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("vacinas").select(fields).eq("id", id).is("deleted_at", null).single();
  if (error) throw new Error(error.message);
  return data as Vacina;
});
