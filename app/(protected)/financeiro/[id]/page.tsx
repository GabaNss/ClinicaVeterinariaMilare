import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/permissions";
import { getFinanceiroById } from "@/lib/db/financeiro";
import { listAuditByRecord } from "@/lib/db/audit";

export default async function FinanceiroDetailPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "VETERINARIO"]);
  const [item, logs] = await Promise.all([getFinanceiroById(params.id), listAuditByRecord("financeiro", params.id)]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Financeiro: {item.categoria}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={item} />
            <Card>
              <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Tipo: {item.tipo}</p>
                <p>Categoria: {item.categoria}</p>
                <p>Descricao: {item.descricao ?? "-"}</p>
                <p>Valor: R$ {Number(item.valor).toFixed(2)}</p>
                <p>Status: {item.status}</p>
                <p>Data competencia: {new Date(item.data_competencia).toLocaleDateString("pt-BR")}</p>
                <p>Data pagamento: {item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString("pt-BR") : "-"}</p>
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
