import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { AgendaItem } from "@/lib/types/db";

const fields = "id, workspace_id, tutor_id, pet_id, veterinario_id, titulo, descricao, data_hora, status, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listAgenda = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("agenda").select(fields).is("deleted_at", null).order("data_hora", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AgendaItem[];
});

export const getAgendaById = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("agenda").select(fields).eq("id", id).is("deleted_at", null).single();
  if (error) throw new Error(error.message);
  return data as AgendaItem;
});
