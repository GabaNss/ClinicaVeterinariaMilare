import { AgendaTable } from "@/components/agenda/agenda-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { listAgenda } from "@/lib/db/agenda";
import { getFormOptions } from "@/lib/db/options";
import { listWorkspaceUsers } from "@/lib/db/profile";

export default async function AgendaPage() {
  const { profile } = await requireUser();
  const [items, options, users] = await Promise.all([
    listAgenda(),
    getFormOptions(),
    profile.role === "ADMIN" ? listWorkspaceUsers() : Promise.resolve([])
  ]);
  const canEdit = canEditByRole(profile.role, "agenda");
  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agenda</h2>
      <AgendaTable
        items={items}
        tutores={options.tutores}
        pets={options.pets}
        vets={options.veterinarios}
        canEdit={canEdit}
        isAdmin={isAdmin}
        currentUserId={profile.id}
        users={users.map((u) => ({ id: u.id, nome: u.full_name ?? "Sem nome" }))}
      />
    </div>
  );
}
