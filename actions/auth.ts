"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { authSchema, resetPasswordRequestSchema, signUpSchema } from "@/schemas/auth";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function signInAction(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = authSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(input: { email: string; password: string; full_name: string; phone?: string }): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const origin = headers().get("origin");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin ? `${origin}/login` : undefined,
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? null
      }
    }
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Conta criada. Verifique seu email se a confirmacao estiver ativa." };
}

export async function forgotPasswordAction(input: { email: string }): Promise<ActionResult> {
  const parsed = resetPasswordRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const origin = headers().get("origin");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    origin ? { redirectTo: `${origin}/reset-password` } : undefined
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Email de recuperacao enviado. Verifique sua caixa de entrada." };
}

export async function signOutAction() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
