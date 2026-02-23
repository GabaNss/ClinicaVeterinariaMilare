"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createAtendimentoAction, deleteAtendimentoAction, updateAtendimentoAction } from "@/actions/atendimentos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Atendimento } from "@/lib/types/db";

type Opt = { id: string; nome?: string; full_name?: string | null };

function AtendimentoDialog({ item, tutores, pets, vets }: { item?: Atendimento; tutores: Opt[]; pets: Opt[]; vets: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo atendimento"}</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{item ? "Editar atendimento" : "Novo atendimento"}</DialogTitle></DialogHeader>
        <form id={`atendimento-form-${item?.id ?? "new"}`} className="space-y-3" action={(formData) => {
          startTransition(async () => {
            const payload = {
              id: item?.id,
              tutor_id: String(formData.get("tutor_id") ?? ""),
              pet_id: String(formData.get("pet_id") ?? ""),
              veterinario_id: String(formData.get("veterinario_id") ?? ""),
              agenda_id: null,
              queixa_principal: String(formData.get("queixa_principal") ?? ""),
              anamnese: String(formData.get("anamnese") ?? ""),
              diagnostico: String(formData.get("diagnostico") ?? ""),
              conduta: String(formData.get("conduta") ?? ""),
              prescricao: String(formData.get("prescricao") ?? ""),
              retorno_em: String(formData.get("retorno_em") ?? "")
            };
            const result = item ? await updateAtendimentoAction(payload) : await createAtendimentoAction(payload);
            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
            if (result.ok) setOpen(false);
          });
        }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Tutor</Label><Select name="tutor_id" defaultValue={item?.tutor_id ?? tutores[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tutores.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Pet</Label><Select name="pet_id" defaultValue={item?.pet_id ?? pets[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Veterinario</Label><Select name="veterinario_id" defaultValue={item?.veterinario_id ?? vets[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.full_name ?? "Sem nome"}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1"><Label>Queixa principal</Label><Textarea name="queixa_principal" defaultValue={item?.queixa_principal ?? ""} /></div>
          <div className="space-y-1"><Label>Anamnese</Label><Textarea name="anamnese" defaultValue={item?.anamnese ?? ""} /></div>
          <div className="space-y-1"><Label>Diagnostico</Label><Textarea name="diagnostico" defaultValue={item?.diagnostico ?? ""} /></div>
          <div className="space-y-1"><Label>Conduta</Label><Textarea name="conduta" defaultValue={item?.conduta ?? ""} /></div>
          <div className="space-y-1"><Label>Prescricao</Label><Textarea name="prescricao" defaultValue={item?.prescricao ?? ""} /></div>
          <div className="space-y-1"><Label>Retorno em</Label><input className="w-full rounded-md border px-3 py-2 text-sm" name="retorno_em" type="date" defaultValue={item?.retorno_em ?? ""} /></div>
        </form>
        <DialogFooter><Button type="submit" form={`atendimento-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AtendimentosTable({ items, tutores, pets, vets, canEdit }: { items: Atendimento[]; tutores: Opt[]; pets: Opt[]; vets: Opt[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const petMap = new Map(pets.map((x) => [x.id, x.nome]));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Atendimentos</CardTitle>
        {canEdit ? <AtendimentoDialog tutores={tutores} pets={pets} vets={vets} /> : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Sem atendimentos.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pet</TableHead><TableHead>Diagnostico</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.updated_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{petMap.get(item.pet_id) ?? "-"}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{item.diagnostico ?? "-"}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-2">
                    <Link href={`/atendimentos/${item.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                    {canEdit ? (
                      <>
                        <AtendimentoDialog item={item} tutores={tutores} pets={pets} vets={vets} />
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => startTransition(async () => {
                          const result = await deleteAtendimentoAction({ id: item.id });
                          toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                        })}><Trash2 className="mr-1 h-4 w-4" />Excluir</Button>
                      </>
                    ) : null}
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
