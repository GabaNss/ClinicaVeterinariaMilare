import { VacinasTable } from "@/components/vacinas/vacinas-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { getFormOptions } from "@/lib/db/options";
import { listVacinas } from "@/lib/db/vacinas";

export default async function VacinasPage() {
  const [{ profile }, items, options] = await Promise.all([requireUser(), listVacinas(), getFormOptions()]);
  const canEdit = canEditByRole(profile.role, "vacinas");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Vacinas</h2>
      <VacinasTable vacinas={items} pets={options.pets.map((p) => ({ id: p.id, nome: p.nome }))} atendimentos={options.atendimentos} canEdit={canEdit} />
    </div>
  );
}
