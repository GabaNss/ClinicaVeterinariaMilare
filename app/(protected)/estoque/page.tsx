import { EstoqueTable } from "@/components/estoque/estoque-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { listEstoque } from "@/lib/db/estoque";

export default async function EstoquePage() {
  const [{ profile }, items] = await Promise.all([requireUser(), listEstoque()]);
  const canEdit = canEditByRole(profile.role, "estoque");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Estoque</h2>
      <EstoqueTable items={items} canEdit={canEdit} />
    </div>
  );
}
