import { PetsTable } from "@/components/pets/pets-table";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { getFormOptions } from "@/lib/db/options";
import { listPets } from "@/lib/db/pets";

export default async function PetsPage() {
  const [{ profile }, pets, options] = await Promise.all([requireUser(), listPets(), getFormOptions()]);
  const canEdit = canEditByRole(profile.role, "pets");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pets</h2>
      <PetsTable pets={pets} tutores={options.tutores} canEdit={canEdit} />
    </div>
  );
}
