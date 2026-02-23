import { AuditLogTable } from "@/components/audit/audit-log-table";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/permissions";
import { listAuditByRecord } from "@/lib/db/audit";
import { listWorkspaceUsers } from "@/lib/db/profile";

export default async function UsuarioDetailPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const [users, logs] = await Promise.all([listWorkspaceUsers(), listAuditByRecord("profiles", params.id)]);
  const user = users.find((u) => u.id === params.id);

  if (!user) {
    return <p className="text-sm">Usuario nao encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Usuario: {user.full_name ?? "Sem nome"}</h2>
      <DetailsTabs
        details={
          <Card>
            <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Role: {user.role}</p>
              <p>Criado em: {new Date(user.created_at).toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
