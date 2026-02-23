import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { Tutor } from "@/lib/types/db";

const fields = "id, workspace_id, nome, cpf_cnpj, telefone, email, endereco, observacoes, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listTutores = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("tutores").select(fields).is("deleted_at", null).order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Tutor[];
});

export const getTutorById = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("tutores").select(fields).eq("id", id).is("deleted_at", null).single();
  if (error) throw new Error(error.message);
  return data as Tutor;
});
