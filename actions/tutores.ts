"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/permissions";
import { tutorSchema } from "@/schemas/tutor";

export async function createTutorAction(input: unknown) {
  const parsed = tutorSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase, profile } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("tutores").insert({ workspace_id: profile.workspace_id, ...parsed.data });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/tutores");
  return { ok: true, message: "Tutor criado" };
}

export async function updateTutorAction(input: unknown) {
  const parsed = tutorSchema.extend({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { id, ...payload } = parsed.data;

  const { error } = await supabase.from("tutores").update(payload).eq("id", id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/tutores");
  revalidatePath(`/tutores/${id}`);
  return { ok: true, message: "Tutor atualizado" };
}

export async function deleteTutorAction(input: { id: string }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "ID invalido" };

  const { supabase } = await requireRole(["ADMIN", "VETERINARIO", "ESTAGIARIO"]);
  const { error } = await supabase.from("tutores").update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).is("deleted_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/tutores");
  return { ok: true, message: "Tutor removido" };
}
