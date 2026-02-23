import { getDashboardStats } from "@/lib/db/dashboard";
import { requireUser } from "@/lib/auth/requireUser";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const [{ profile }, stats] = await Promise.all([requireUser(), getDashboardStats()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visao geral da clinica</h2>
      </div>
      <DashboardOverview stats={stats} role={profile.role} />
    </div>
  );
}
