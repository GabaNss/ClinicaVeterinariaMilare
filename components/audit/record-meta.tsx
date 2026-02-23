import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditFields } from "@/lib/types/db";

export function RecordMeta({ record }: { record: AuditFields }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rastreabilidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Criado por: <strong>{record.created_by_name}</strong> - {new Date(record.created_at).toLocaleString("pt-BR")}
        </p>
        <p>
          Ultima alteracao por: <strong>{record.updated_by_name}</strong> - {new Date(record.updated_at).toLocaleString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}
