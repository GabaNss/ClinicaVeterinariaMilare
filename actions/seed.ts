"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/permissions";

export async function seedWorkspaceDataAction() {
  const { supabase, profile } = await requireRole(["ADMIN"]);

  const { data: tutorData, error: tutorError } = await supabase
    .from("tutores")
    .insert({ workspace_id: profile.workspace_id, nome: "Cliente Exemplo", telefone: "(11) 99999-0000" })
    .select("id")
    .single();

  if (tutorError || !tutorData) {
    return { ok: false, message: tutorError?.message ?? "Falha ao criar tutor" };
  }

  const { data: petData, error: petError } = await supabase
    .from("pets")
    .insert({ workspace_id: profile.workspace_id, tutor_id: tutorData.id, nome: "Rex", especie: "Canino", raca: "SRD" })
    .select("id")
    .single();

  if (petError || !petData) {
    return { ok: false, message: petError?.message ?? "Falha ao criar pet" };
  }

  const { error: agendaError } = await supabase.from("agenda").insert({
    workspace_id: profile.workspace_id,
    tutor_id: tutorData.id,
    pet_id: petData.id,
    titulo: "Consulta inicial",
    data_hora: new Date().toISOString(),
    status: "AGENDADO"
  });

  if (agendaError) {
    return { ok: false, message: agendaError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/tutores");
  revalidatePath("/pets");
  revalidatePath("/agenda");

  return { ok: true, message: "Dados exemplo criados" };
}
