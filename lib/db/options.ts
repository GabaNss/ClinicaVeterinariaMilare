import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";

export const getFormOptions = cache(async () => {
  const { supabase } = await requireUser();

  const [tutores, pets, vets, atendimentos] = await Promise.all([
    supabase.from("tutores").select("id, nome").is("deleted_at", null).order("nome", { ascending: true }),
    supabase.from("pets").select("id, nome, tutor_id").is("deleted_at", null).order("nome", { ascending: true }),
    supabase.from("profiles").select("id, full_name, role").in("role", ["ADMIN", "VETERINARIO"]).order("full_name", { ascending: true }),
    supabase.from("atendimentos").select("id, pet_id, created_at").is("deleted_at", null).order("created_at", { ascending: false })
  ]);

  const error = tutores.error ?? pets.error ?? vets.error ?? atendimentos.error;
  if (error) {
    throw new Error(error.message);
  }

  return {
    tutores: tutores.data ?? [],
    pets: pets.data ?? [],
    veterinarios: vets.data ?? [],
    atendimentos: atendimentos.data ?? []
  };
});
