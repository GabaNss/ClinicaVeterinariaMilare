import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuditByRecord } from "@/lib/db/audit";
import { getFormOptions } from "@/lib/db/options";
import { getVacinaById } from "@/lib/db/vacinas";

export default async function VacinaDetailPage({ params }: { params: { id: string } }) {
  const [vacina, logs, options] = await Promise.all([getVacinaById(params.id), listAuditByRecord("vacinas", params.id), getFormOptions()]);
  const pet = options.pets.find((p) => p.id === vacina.pet_id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Vacina: {vacina.nome}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={vacina} />
            <Card>
              <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Pet: {pet?.nome ?? "-"}</p>
                <p>Data aplicacao: {new Date(vacina.data_aplicacao).toLocaleDateString("pt-BR")}</p>
                <p>Proxima dose: {vacina.proxima_dose ?? "-"}</p>
                <p>Lote: {vacina.lote ?? "-"}</p>
                <p>Fabricante: {vacina.fabricante ?? "-"}</p>
                <p>Observacoes: {vacina.observacoes ?? "-"}</p>
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
