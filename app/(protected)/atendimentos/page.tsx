import { AtendimentosTable } from "@/components/atendimentos/atendimentos-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { listAtendimentos } from "@/lib/db/atendimentos";
import { getFormOptions } from "@/lib/db/options";

export default async function AtendimentosPage() {
  const [{ profile }, items, options] = await Promise.all([requireUser(), listAtendimentos(), getFormOptions()]);
  const canEdit = canEditByRole(profile.role, "atendimentos");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Atendimentos</h2>
      <AtendimentosTable items={items} tutores={options.tutores} pets={options.pets} vets={options.veterinarios} canEdit={canEdit} />
    </div>
  );
}
