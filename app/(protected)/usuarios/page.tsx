import { UsuariosTable } from "@/components/usuarios/usuarios-table";
import { requireRole } from "@/lib/auth/permissions";
import { listWorkspaceUsers } from "@/lib/db/profile";

export default async function UsuariosPage() {
  const [{ profile }, users] = await Promise.all([requireRole(["ADMIN"]), listWorkspaceUsers()]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Usuarios e Permissoes</h2>
      <UsuariosTable users={users} canManage={profile.role === "ADMIN"} />
    </div>
  );
}
