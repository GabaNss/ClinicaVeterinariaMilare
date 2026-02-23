import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/db";

export async function requireUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, workspace_id, full_name, avatar_url, role, is_approved, approved_at, approved_by, theme_preference, created_at")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login?reason=profile_missing");
  }

  if (!profile.is_approved) {
    redirect("/login?reason=pending_approval");
  }

  return {
    supabase,
    user: data.user,
    profile: profile as {
      id: string;
      workspace_id: string;
      full_name: string | null;
      avatar_url: string | null;
      role: UserRole;
      is_approved: boolean;
      approved_at: string | null;
      approved_by: string | null;
      theme_preference: "light" | "dark";
      created_at: string;
    }
  };
}
