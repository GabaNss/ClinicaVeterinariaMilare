import { requireUser } from "@/lib/auth/requireUser";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const runtime = "nodejs";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", profile.workspace_id)
    .single();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar role={profile.role} />
      <div className="flex-1 pb-20 md:pb-0">
        <Topbar
          userName={profile.full_name ?? "Usuario"}
          workspaceName={workspace?.name ?? "Workspace"}
          themePreference={profile.theme_preference ?? "light"}
        />
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
