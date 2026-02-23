"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { petSchema } from "@/schemas/pet";

export async function createPetAction(input: unknown) {
  const parsed = petSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("pets").insert({
    workspace_id: profile.workspace_id,
    tutor_id: parsed.data.tutor_id,
    nome: parsed.data.nome,
    especie: parsed.data.especie,
    raca: parsed.data.raca || null,
    sexo: parsed.data.sexo || null,
    cor: parsed.data.cor || null,
    data_nascimento: parsed.data.data_nascimento || null,
    peso_kg: parsed.data.peso_kg ?? null,
    microchip: parsed.data.microchip || null,
    observacoes: parsed.data.observacoes || null
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/pets");
  return { ok: true, message: "Pet criado" };
}

export async function updatePetAction(input: unknown) {
  const parsed = petSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("pets")
    .update({
      tutor_id: rest.tutor_id,
      nome: rest.nome,
      especie: rest.especie,
      raca: rest.raca || null,
      sexo: rest.sexo || null,
      cor: rest.cor || null,
      data_nascimento: rest.data_nascimento || null,
      peso_kg: rest.peso_kg ?? null,
      microchip: rest.microchip || null,
      observacoes: rest.observacoes || null
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/pets");
  revalidatePath(`/pets/${id}`);
  return { ok: true, message: "Pet atualizado" };
}

export async function deletePetAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("pets").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/pets");
  return { ok: true, message: "Pet removido" };
}
