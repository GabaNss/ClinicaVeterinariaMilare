import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgendaById } from "@/lib/db/agenda";
import { listAuditByRecord } from "@/lib/db/audit";
import { getFormOptions } from "@/lib/db/options";

export default async function AgendaDetailPage({ params }: { params: { id: string } }) {
  const [agenda, logs, options] = await Promise.all([getAgendaById(params.id), listAuditByRecord("agenda", params.id), getFormOptions()]);
  const tutor = options.tutores.find((t) => t.id === agenda.tutor_id);
  const pet = options.pets.find((p) => p.id === agenda.pet_id);
  const vet = options.veterinarios.find((v) => v.id === agenda.veterinario_id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agenda: {agenda.titulo}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={agenda} />
            <Card>
              <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Data/Hora: {new Date(agenda.data_hora).toLocaleString("pt-BR")}</p>
                <p>Tipo do evento: {agenda.tipo_evento}</p>
                <p>Status: {agenda.status}</p>
                <p>Tutor: {tutor?.nome ?? "-"}</p>
                <p>Pet: {pet?.nome ?? "-"}</p>
                <p>Veterinario: {vet?.full_name ?? "-"}</p>
                <p>Descricao: {agenda.descricao ?? "-"}</p>
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
