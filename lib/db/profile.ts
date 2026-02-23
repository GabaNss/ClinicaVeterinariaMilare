import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";

export const getProfileWithWorkspace = cache(async () => {
  const { supabase, profile, user } = await requireUser();

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, created_at")
    .eq("id", profile.workspace_id)
    .single();

  if (error || !workspace) {
    throw new Error(error?.message ?? "Workspace nao encontrado");
  }

  return { user, profile, workspace };
});

export const listWorkspaceUsers = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, workspace_id, full_name, avatar_url, role, is_approved, approved_at, approved_by, theme_preference, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});
