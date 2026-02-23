import { FinanceiroTable } from "@/components/financeiro/financeiro-table";
import { canEditByRole, requireRole } from "@/lib/auth/permissions";
import { listFinanceiro } from "@/lib/db/financeiro";
import { getFormOptions } from "@/lib/db/options";

export default async function FinanceiroPage() {
  const [{ profile }, items, options] = await Promise.all([requireRole(["ADMIN", "VETERINARIO"]), listFinanceiro(), getFormOptions()]);
  const canEdit = canEditByRole(profile.role, "financeiro");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Financeiro</h2>
      <FinanceiroTable items={items} tutores={options.tutores} pets={options.pets.map((p) => ({ id: p.id, nome: p.nome }))} atendimentos={options.atendimentos} canEdit={canEdit} />
    </div>
  );
}
