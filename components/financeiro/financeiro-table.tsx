"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createFinanceiroAction, deleteFinanceiroAction, updateFinanceiroAction } from "@/actions/financeiro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Financeiro } from "@/lib/types/db";

type TutorOption = { id: string; nome: string };
type PetOption = { id: string; nome: string };
type AtendimentoOption = { id: string; pet_id: string; created_at: string };

function FinanceiroDialog({ item, tutores, pets, atendimentos }: { item?: Financeiro; tutores: TutorOption[]; pets: PetOption[]; atendimentos: AtendimentoOption[] }) {
  const [open, setOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<"CONSULTA" | "DESPESA">(item?.tipo === "DESPESA" ? "DESPESA" : "CONSULTA");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo lancamento"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar lancamento" : "Novo lancamento"}</DialogTitle></DialogHeader>
        <form id={`financeiro-form-${item?.id ?? "new"}`} className="space-y-3" action={(formData) => {
          startTransition(async () => {
            const mode = String(formData.get("entry_mode") ?? "CONSULTA");
            const isDespesa = mode === "DESPESA";
            const today = new Date().toISOString().slice(0, 10);
            const atendimento = String(formData.get("atendimento_id") ?? "none");
            const pet = String(formData.get("pet_id") ?? "none");
            const titulo = String(formData.get("titulo") ?? "");
            const payload = {
              id: item?.id,
              atendimento_id: isDespesa ? null : (atendimento === "none" ? null : atendimento),
              tutor_id: String(formData.get("tutor_id") ?? item?.tutor_id ?? tutores[0]?.id ?? ""),
              pet_id: isDespesa ? null : (pet === "none" ? null : pet),
              tipo: isDespesa ? "DESPESA" : "RECEITA",
              categoria: isDespesa ? titulo : String(formData.get("categoria") ?? "Consulta"),
              descricao: String(formData.get("descricao") ?? ""),
              valor: Number(formData.get("valor") ?? 0),
              data_competencia: String(formData.get("data_competencia") ?? item?.data_competencia ?? today),
              status: String(formData.get("status") ?? item?.status ?? "PENDENTE"),
              data_pagamento: String(formData.get("data_pagamento") ?? item?.data_pagamento ?? "")
            };
            const result = item ? await updateFinanceiroAction(payload) : await createFinanceiroAction(payload);
            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
            if (result.ok) setOpen(false);
          });
        }}>
          <input type="hidden" name="entry_mode" value={entryMode} />
          <input type="hidden" name="status" value={item?.status ?? "PENDENTE"} />
          <input type="hidden" name="data_competencia" value={item?.data_competencia ?? new Date().toISOString().slice(0, 10)} />
          <input type="hidden" name="data_pagamento" value={item?.data_pagamento ?? ""} />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" size="sm" variant={entryMode === "CONSULTA" ? "default" : "outline"} onClick={() => setEntryMode("CONSULTA")}>
              Consulta (Receita)
            </Button>
            <Button type="button" size="sm" variant={entryMode === "DESPESA" ? "default" : "outline"} onClick={() => setEntryMode("DESPESA")}>
              Despesa
            </Button>
          </div>
          {entryMode === "CONSULTA" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tutor</Label>
                  <SearchableSelect
                    name="tutor_id"
                    defaultValue={item?.tutor_id ?? tutores[0]?.id}
                    searchPlaceholder="Buscar tutor..."
                    options={tutores.map((tutor) => ({ value: tutor.id, label: tutor.nome }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pet</Label>
                  <SearchableSelect
                    name="pet_id"
                    defaultValue={item?.pet_id ?? "none"}
                    searchPlaceholder="Buscar pet..."
                    options={[
                      { value: "none", label: "Sem pet" },
                      ...pets.map((pet) => ({ value: pet.id, label: pet.nome }))
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-1"><Label>Atendimento</Label><Select name="atendimento_id" defaultValue={item?.atendimento_id ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem atendimento</SelectItem>{atendimentos.map((a) => <SelectItem key={a.id} value={a.id}>{a.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="categoria">Titulo</Label><Input id="categoria" name="categoria" defaultValue={item?.categoria ?? "Consulta"} required /></div>
                <div className="space-y-1"><Label htmlFor="valor">Valor</Label><Input id="valor" name="valor" type="number" step="0.01" defaultValue={item?.valor ?? 0} required /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="descricao">Descricao</Label><Input id="descricao" name="descricao" defaultValue={item?.descricao ?? ""} /></div>
            </>
          ) : (
            <>
              <input type="hidden" name="tutor_id" value={item?.tutor_id ?? tutores[0]?.id ?? ""} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="titulo">Titulo</Label><Input id="titulo" name="titulo" defaultValue={item?.categoria ?? ""} required /></div>
                <div className="space-y-1"><Label htmlFor="valor">Valor</Label><Input id="valor" name="valor" type="number" step="0.01" defaultValue={item?.valor ?? 0} required /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="descricao">Descricao</Label><Input id="descricao" name="descricao" defaultValue={item?.descricao ?? ""} /></div>
            </>
          )}
        </form>
        <DialogFooter><Button type="submit" form={`financeiro-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceiroTable({ items, tutores, pets, atendimentos, canEdit }: { items: Financeiro[]; tutores: TutorOption[]; pets: PetOption[]; atendimentos: AtendimentoOption[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"TODOS" | "HOJE" | "SEMANA" | "MES">("TODOS");
  const [typeFilter, setTypeFilter] = useState<"TODOS" | "RECEITA" | "DESPESA">("TODOS");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | "PENDENTE" | "PAGO" | "CANCELADO">("TODOS");
  const { toast } = useToast();
  const tutorMap = useMemo(() => new Map(tutores.map((tutor) => [tutor.id, tutor.nome])), [tutores]);
  const petMap = useMemo(() => new Map(pets.map((pet) => [pet.id, pet.nome])), [pets]);
  const normalizedSearch = search.trim().toLowerCase();
  const periodMatches = (value: string) => {
    if (periodFilter === "TODOS") return true;
    const itemDate = new Date(`${value}T00:00:00`);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (periodFilter === "HOJE") {
      const endToday = new Date(startToday);
      endToday.setDate(endToday.getDate() + 1);
      return itemDate >= startToday && itemDate < endToday;
    }
    if (periodFilter === "SEMANA") {
      const day = startToday.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const startWeek = new Date(startToday);
      startWeek.setDate(startWeek.getDate() - diffToMonday);
      const endWeek = new Date(startWeek);
      endWeek.setDate(endWeek.getDate() + 7);
      return itemDate >= startWeek && itemDate < endWeek;
    }
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return itemDate >= startMonth && itemDate < endMonth;
  };
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !normalizedSearch || [
        item.tipo,
        item.categoria,
        item.status,
        item.descricao ?? "",
        tutorMap.get(item.tutor_id) ?? "",
        item.pet_id ? petMap.get(item.pet_id) ?? "" : "",
        String(item.valor)
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesType = typeFilter === "TODOS" || item.tipo === typeFilter;
      const matchesStatus = statusFilter === "TODOS" || item.status === statusFilter;
      const matchesPeriod = periodMatches(item.data_competencia);
      return matchesSearch && matchesType && matchesStatus && matchesPeriod;
    });
  }, [items, normalizedSearch, petMap, statusFilter, tutorMap, typeFilter, periodFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Financeiro</CardTitle>
        {canEdit ? <FinanceiroDialog tutores={tutores} pets={pets} atendimentos={atendimentos} /> : null}
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar lancamento por tipo, categoria, tutor, status..."
          />
        </div>
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Periodo</Label>
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as "TODOS" | "HOJE" | "SEMANA" | "MES")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="HOJE">Hoje</SelectItem>
                <SelectItem value="SEMANA">Esta semana</SelectItem>
                <SelectItem value="MES">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "TODOS" | "RECEITA" | "DESPESA")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "TODOS" | "PENDENTE" | "PAGO" | "CANCELADO")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {filteredItems.length === 0 ? <p className="text-sm text-muted-foreground">{items.length === 0 ? "Nenhum lancamento financeiro." : "Nenhum lancamento encontrado."}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
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
