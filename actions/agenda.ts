"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { agendaSchema } from "@/schemas/agenda";

export async function createAgendaAction(input: unknown) {
  const parsed = agendaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("agenda").insert({
    workspace_id: profile.workspace_id,
    tutor_id: parsed.data.tutor_id ?? null,
    pet_id: parsed.data.pet_id ?? null,
    veterinario_id: parsed.data.veterinario_id ?? null,
    tipo: parsed.data.tipo,
    tipo_evento: parsed.data.tipo_evento,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    data_hora: parsed.data.data_hora,
    status: parsed.data.status
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/agenda");
  return { ok: true, message: "Evento de agenda criado" };
}

export async function updateAgendaAction(input: unknown) {
  const parsed = agendaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  if (!parsed.data.id) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("agenda")
    .update({
      tutor_id: rest.tutor_id ?? null,
      pet_id: rest.pet_id ?? null,
      veterinario_id: rest.veterinario_id ?? null,
      tipo: rest.tipo,
      tipo_evento: rest.tipo_evento,
      titulo: rest.titulo,
      descricao: rest.descricao || null,
      data_hora: rest.data_hora,
      status: rest.status
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  return { ok: true, message: "Agenda atualizada" };
}

export async function deleteAgendaAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("agenda").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/agenda");
  return { ok: true, message: "Agenda removida" };
}
