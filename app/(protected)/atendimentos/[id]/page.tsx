import { softDeleteAttachmentAction, uploadAttachmentAction } from "@/actions/attachments";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { RecordMeta } from "@/components/audit/record-meta";
import { DetailsTabs } from "@/components/shared/details-tabs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/requireUser";
import { canEditByRole } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAtendimentoAttachments, getAtendimentoById } from "@/lib/db/atendimentos";
import { listAuditByRecord } from "@/lib/db/audit";
import { getFormOptions } from "@/lib/db/options";

export default async function AtendimentoDetailPage({ params }: { params: { id: string } }) {
  const [{ supabase, profile }, item, logs, options, attachments] = await Promise.all([
    requireUser(),
    getAtendimentoById(params.id),
    listAuditByRecord("atendimentos", params.id),
    getFormOptions(),
    listAtendimentoAttachments(params.id)
  ]);

  const canManageAttachments = canEditByRole(profile.role, "atendimentos");
  const tutor = options.tutores.find((t) => t.id === item.tutor_id);
  const pet = options.pets.find((p) => p.id === item.pet_id);
  const vet = options.veterinarios.find((v) => v.id === item.veterinario_id);
  const attachmentsWithLinks = await Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage.from("atendimento-anexos").createSignedUrl(attachment.file_path, 600, {
        download: attachment.file_name
      });
      return { ...attachment, signed_url: data?.signedUrl ?? null };
    })
  );

  async function uploadAction(formData: FormData) {
    "use server";
    await uploadAttachmentAction(formData);
  }

  async function deleteAttachmentAction(formData: FormData) {
    "use server";
    await softDeleteAttachmentAction({
      id: String(formData.get("attachment_id") ?? ""),
      atendimento_id: String(formData.get("atendimento_id") ?? "")
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Atendimento {item.id.slice(0, 8)}</h2>
      <DetailsTabs
        details={
          <div className="space-y-4">
            <RecordMeta record={item} />
            <Card>
              <CardHeader><CardTitle>Prontuario</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Tutor: {tutor?.nome ?? "-"}</p>
                <p>Pet: {pet?.nome ?? "-"}</p>
                <p>Veterinario: {vet?.full_name ?? "-"}</p>
                <p>Queixa principal: {item.queixa_principal ?? "-"}</p>
                <p>Anamnese: {item.anamnese ?? "-"}</p>
                <p>Diagnostico: {item.diagnostico ?? "-"}</p>
                <p>Conduta: {item.conduta ?? "-"}</p>
                <p>Prescricao: {item.prescricao ?? "-"}</p>
                <p>Retorno em: {item.retorno_em ?? "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Anexos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {canManageAttachments ? (
                  <form action={uploadAction} className="flex flex-col gap-2 md:flex-row md:items-end">
                    <input type="hidden" name="atendimento_id" value={item.id} />
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Arquivo</label>
                      <input name="file" type="file" className="block text-sm" required />
                    </div>
                    <Button type="submit">Enviar anexo</Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Somente leitura para anexos.</p>
                )}
                {attachmentsWithLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem anexos.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {attachmentsWithLinks.map((a) => (
                      <li key={a.id} className="rounded border p-2">
                        <p className="font-medium">
                          {a.signed_url ? <a href={a.signed_url} target="_blank" rel="noreferrer" className="underline">{a.file_name}</a> : a.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Enviado por {a.created_by_name} em {new Date(a.created_at).toLocaleString("pt-BR")}</p>
                        {canManageAttachments ? (
                          <form action={deleteAttachmentAction} className="mt-2">
                            <input type="hidden" name="attachment_id" value={a.id} />
                            <input type="hidden" name="atendimento_id" value={item.id} />
                            <Button type="submit" size="sm" variant="destructive">Excluir anexo</Button>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        }
        audit={<AuditLogTable logs={logs} />}
      />
    </div>
  );
}
