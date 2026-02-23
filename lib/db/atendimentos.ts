import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { Atendimento, AtendimentoAttachment } from "@/lib/types/db";

const fields = "id, workspace_id, tutor_id, pet_id, veterinario_id, agenda_id, queixa_principal, anamnese, diagnostico, conduta, prescricao, retorno_em, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name";

export const listAtendimentos = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("atendimentos").select(fields).is("deleted_at", null).order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Atendimento[];
});

export const getAtendimentoById = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("atendimentos").select(fields).eq("id", id).is("deleted_at", null).single();
  if (error) throw new Error(error.message);
  return data as Atendimento;
});

export const listAtendimentoAttachments = cache(async (atendimentoId: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("atendimento_attachments")
    .select("id, workspace_id, atendimento_id, file_name, file_path, mime_type, size_bytes, created_at, created_by, created_by_name, updated_at, updated_by, updated_by_name, deleted_at, deleted_by, deleted_by_name")
    .eq("atendimento_id", atendimentoId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AtendimentoAttachment[];
});
