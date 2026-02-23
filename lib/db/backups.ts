import { cache } from "react";
import { requireRole } from "@/lib/auth/permissions";
import type { WorkspaceBackup } from "@/lib/types/db";

export const listWorkspaceBackups = cache(async () => {
  const { supabase } = await requireRole(["ADMIN"]);
  const { data, error } = await supabase
    .from("workspace_backups")
    .select("id, workspace_id, file_name, checksum_sha256, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkspaceBackup[];
});
