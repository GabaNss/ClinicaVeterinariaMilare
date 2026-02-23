"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createFinanceiroAction, deleteFinanceiroAction, updateFinanceiroAction } from "@/actions/financeiro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Financeiro } from "@/lib/types/db";

type TutorOption = { id: string; nome: string };
type PetOption = { id: string; nome: string };
type AtendimentoOption = { id: string; pet_id: string; created_at: string };

function FinanceiroDialog({ item, tutores, pets, atendimentos }: { item?: Financeiro; tutores: TutorOption[]; pets: PetOption[]; atendimentos: AtendimentoOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo lancamento"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar lancamento" : "Novo lancamento"}</DialogTitle></DialogHeader>
        <form id={`financeiro-form-${item?.id ?? "new"}`} className="space-y-3" action={(formData) => {
          startTransition(async () => {
            const atendimento = String(formData.get("atendimento_id") ?? "none");
            const pet = String(formData.get("pet_id") ?? "none");
            const payload = {
              id: item?.id,
              atendimento_id: atendimento === "none" ? null : atendimento,
              tutor_id: String(formData.get("tutor_id") ?? ""),
              pet_id: pet === "none" ? null : pet,
              tipo: String(formData.get("tipo") ?? "RECEITA"),
              categoria: String(formData.get("categoria") ?? ""),
              descricao: String(formData.get("descricao") ?? ""),
              valor: Number(formData.get("valor") ?? 0),
              data_competencia: String(formData.get("data_competencia") ?? ""),
              status: String(formData.get("status") ?? "PENDENTE"),
              data_pagamento: String(formData.get("data_pagamento") ?? "")
            };
            const result = item ? await updateFinanceiroAction(payload) : await createFinanceiroAction(payload);
            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
            if (result.ok) setOpen(false);
          });
        }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Tutor</Label><Select name="tutor_id" defaultValue={item?.tutor_id ?? tutores[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tutores.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Pet</Label><Select name="pet_id" defaultValue={item?.pet_id ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem pet</SelectItem>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1"><Label>Atendimento</Label><Select name="atendimento_id" defaultValue={item?.atendimento_id ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem atendimento</SelectItem>{atendimentos.map((a) => <SelectItem key={a.id} value={a.id}>{a.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Tipo</Label><Select name="tipo" defaultValue={item?.tipo ?? "RECEITA"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RECEITA">RECEITA</SelectItem><SelectItem value="DESPESA">DESPESA</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="categoria">Categoria</Label><Input id="categoria" name="categoria" defaultValue={item?.categoria ?? ""} required /></div>
            <div className="space-y-1"><Label htmlFor="valor">Valor</Label><Input id="valor" name="valor" type="number" step="0.01" defaultValue={item?.valor ?? 0} required /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="data_competencia">Data competencia</Label><Input id="data_competencia" name="data_competencia" type="date" defaultValue={item?.data_competencia ?? ""} required /></div>
            <div className="space-y-1"><Label>Status</Label><Select name="status" defaultValue={item?.status ?? "PENDENTE"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDENTE">PENDENTE</SelectItem><SelectItem value="PAGO">PAGO</SelectItem><SelectItem value="CANCELADO">CANCELADO</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="data_pagamento">Data pagamento</Label><Input id="data_pagamento" name="data_pagamento" type="date" defaultValue={item?.data_pagamento ?? ""} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="descricao">Descricao</Label><Input id="descricao" name="descricao" defaultValue={item?.descricao ?? ""} /></div>
        </form>
        <DialogFooter><Button type="submit" form={`financeiro-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceiroTable({ items, tutores, pets, atendimentos, canEdit }: { items: Financeiro[]; tutores: TutorOption[]; pets: PetOption[]; atendimentos: AtendimentoOption[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Financeiro</CardTitle>
        {canEdit ? <FinanceiroDialog tutores={tutores} pets={pets} atendimentos={atendimentos} /> : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lancamento financeiro.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell>R$ {Number(item.valor).toFixed(2)}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-2">
                    <Link href={`/financeiro/${item.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                    {canEdit ? (
                      <>
                        <FinanceiroDialog item={item} tutores={tutores} pets={pets} atendimentos={atendimentos} />
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => startTransition(async () => {
                          const result = await deleteFinanceiroAction({ id: item.id });
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
