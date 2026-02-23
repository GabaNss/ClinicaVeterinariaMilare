import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import type { AuditLog } from "@/lib/types/db";

export const listAuditByRecord = cache(async (tableName: string, recordId: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, workspace_id, table_name, record_id, action, before_data, after_data, actor_id, actor_name, actor_role, created_at")
    .eq("table_name", tableName)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLog[];
});
