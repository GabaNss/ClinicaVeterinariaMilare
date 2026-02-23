import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuditByRecord } from "@/lib/db/audit";
import { getFormOptions } from "@/lib/db/options";
import { getPetById } from "@/lib/db/pets";

export default async function PetDetailPage({ params }: { params: { id: string } }) {
  const [pet, logs, options] = await Promise.all([getPetById(params.id), listAuditByRecord("pets", params.id), getFormOptions()]);
  const tutor = options.tutores.find((t) => t.id === pet.tutor_id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pet: {pet.nome}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={pet} />
            <Card>
              <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Tutor: {tutor?.nome ?? "-"}</p>
                <p>Especie: {pet.especie}</p>
                <p>Raca: {pet.raca ?? "-"}</p>
                <p>Sexo: {pet.sexo ?? "-"}</p>
                <p>Cor: {pet.cor ?? "-"}</p>
                <p>Nascimento: {pet.data_nascimento ?? "-"}</p>
                <p>Peso (kg): {pet.peso_kg ?? "-"}</p>
                <p>Microchip: {pet.microchip ?? "-"}</p>
                <p>Observacoes: {pet.observacoes ?? "-"}</p>
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
