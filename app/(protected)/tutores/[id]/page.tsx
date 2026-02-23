import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuditByRecord } from "@/lib/db/audit";
import { getTutorById } from "@/lib/db/tutores";
import { formatCpfCnpj, formatPhone } from "@/lib/masks";

export default async function TutorDetailPage({ params }: { params: { id: string } }) {
  const [tutor, logs] = await Promise.all([getTutorById(params.id), listAuditByRecord("tutores", params.id)]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tutor: {tutor.nome}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={tutor} />
            <Card>
              <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>CPF/CNPJ: {tutor.cpf_cnpj ? formatCpfCnpj(tutor.cpf_cnpj) : "-"}</p>
                <p>Telefone: {tutor.telefone ? formatPhone(tutor.telefone) : "-"}</p>
                <p>Email: {tutor.email ?? "-"}</p>
                <p>Endereco: {tutor.endereco ?? "-"}</p>
                <p>Observacoes: {tutor.observacoes ?? "-"}</p>
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
