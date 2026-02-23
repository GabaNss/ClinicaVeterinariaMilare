import { TutoresTable } from "@/components/tutores/tutores-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { listTutores } from "@/lib/db/tutores";

export default async function TutoresPage() {
  const [{ profile }, tutores] = await Promise.all([requireUser(), listTutores()]);
  const canEdit = canEditByRole(profile.role, "tutores");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tutores</h2>
      <TutoresTable tutores={tutores} canEdit={canEdit} />
    </div>
  );
}
