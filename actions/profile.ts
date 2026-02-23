"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { profileApprovalSchema, profileRoleSchema, profileSchema, themePreferenceSchema } from "@/schemas/profile";
import { requireUser } from "@/lib/auth/requireUser";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateProfileAction(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Perfil atualizado" };
}

export async function setThemePreferenceAction(input: unknown) {
  const parsed = themePreferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: parsed.data.theme_preference })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  cookies().set("theme", parsed.data.theme_preference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { ok: true, message: "Tema atualizado" };
}

export async function updateUserRoleAction(input: unknown) {
  const parsed = profileRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { supabase, profile } = await requireUser();

  if (profile.role !== "ADMIN") {
    return { ok: false, message: "Apenas ADMIN pode alterar permissoes" };
  }

  const { error } = await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/usuarios");
  return { ok: true, message: "Perfil de permissao atualizado" };
}

export async function updateUserApprovalAction(input: unknown) {
  const parsed = profileApprovalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { supabase, profile, user } = await requireUser();

  if (profile.role !== "ADMIN") {
    return { ok: false, message: "Apenas ADMIN pode autorizar usuarios" };
  }

  if (parsed.data.id === user.id && !parsed.data.approved) {
    return { ok: false, message: "Nao e possivel revogar a propria autorizacao" };
  }

  const payload = parsed.data.approved
    ? { is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id }
    : { is_approved: false, approved_at: null, approved_by: null };

  const { error } = await supabase.from("profiles").update(payload).eq("id", parsed.data.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/usuarios");
  return { ok: true, message: parsed.data.approved ? "Usuario autorizado" : "Autorizacao revogada" };
}

export async function deleteUserAccountAction(input: unknown) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "ID de usuario invalido" };
  }

  const { supabase, profile, user } = await requireUser();

  if (profile.role !== "ADMIN") {
    return { ok: false, message: "Apenas ADMIN pode excluir contas" };
  }

  if (parsed.data.id === user.id) {
    return { ok: false, message: "Nao e possivel excluir a propria conta" };
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, workspace_id, role")
    .eq("id", parsed.data.id)
    .eq("workspace_id", profile.workspace_id)
    .single();

  if (targetError || !targetProfile) {
    return { ok: false, message: "Usuario nao encontrado neste workspace" };
  }

  if (targetProfile.role === "ADMIN") {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", profile.workspace_id)
      .eq("role", "ADMIN");

    if (countError) {
      return { ok: false, message: countError.message };
    }

    if ((count ?? 0) <= 1) {
      return { ok: false, message: "Nao e possivel excluir o ultimo ADMIN do workspace" };
    }
  }

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(parsed.data.id);

  if (error) {
    if (error.message.toLowerCase().includes("foreign key")) {
      return { ok: false, message: "Nao foi possivel excluir: este usuario possui registros vinculados." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/usuarios");
  return { ok: true, message: "Conta excluida com sucesso" };
}
