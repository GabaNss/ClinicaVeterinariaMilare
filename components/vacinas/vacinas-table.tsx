"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { BellRing, CalendarDays, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createVacinaAction, deleteVacinaAction, updateVacinaAction } from "@/actions/vacinas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Vacina } from "@/lib/types/db";

type PetOption = { id: string; nome: string };
type AtendimentoOption = { id: string; pet_id: string; created_at: string };
type Tab = "registro" | "calendario" | "avisos";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function formatDateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startCalendarGrid(value: Date) {
  const start = monthStart(value);
  const mondayOffset = (start.getDay() + 6) % 7;
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() - mondayOffset);
}

function toDateOnly(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
}

function parseLocalDate(value: string) {
  const raw = value.slice(0, 10);
  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toEpochDayLocal(value: string) {
  const date = parseLocalDate(value);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return "-";
  const raw = value.slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function VacinaDialog({ item, pets, atendimentos }: { item?: Vacina; pets: PetOption[]; atendimentos: AtendimentoOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Nova vacina"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar vacina" : "Nova vacina"}</DialogTitle></DialogHeader>
        <form id={`vacina-form-${item?.id ?? "new"}`} className="space-y-3" action={(formData) => {
          startTransition(async () => {
            const atendimentoId = String(formData.get("atendimento_id") ?? "none");
            const payload = {
              id: item?.id,
              pet_id: String(formData.get("pet_id") ?? ""),
              atendimento_id: atendimentoId === "none" ? null : atendimentoId,
              nome: String(formData.get("nome") ?? ""),
              lote: String(formData.get("lote") ?? ""),
              fabricante: String(formData.get("fabricante") ?? ""),
              data_aplicacao: String(formData.get("data_aplicacao") ?? ""),
              proxima_dose: String(formData.get("proxima_dose") ?? ""),
              observacoes: String(formData.get("observacoes") ?? "")
            };
            const result = item ? await updateVacinaAction(payload) : await createVacinaAction(payload);
            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
            if (result.ok) setOpen(false);
          });
        }}>
          <div className="space-y-1"><Label>Pet</Label><Select name="pet_id" defaultValue={item?.pet_id ?? pets[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label>Atendimento</Label><Select name="atendimento_id" defaultValue={item?.atendimento_id ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem atendimento</SelectItem>{atendimentos.map((a) => <SelectItem key={a.id} value={a.id}>{a.id.slice(0, 8)} - {new Date(a.created_at).toLocaleDateString("pt-BR")}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div className="space-y-1"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" defaultValue={item?.nome ?? ""} required /></div><div className="space-y-1"><Label htmlFor="data_aplicacao">Data aplicacao</Label><Input id="data_aplicacao" name="data_aplicacao" type="date" defaultValue={toDateOnly(item?.data_aplicacao) ?? ""} required /></div></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div className="space-y-1"><Label htmlFor="lote">Lote</Label><Input id="lote" name="lote" defaultValue={item?.lote ?? ""} /></div><div className="space-y-1"><Label htmlFor="fabricante">Fabricante</Label><Input id="fabricante" name="fabricante" defaultValue={item?.fabricante ?? ""} /></div></div>
          <div className="space-y-1"><Label htmlFor="proxima_dose">Proxima dose</Label><Input id="proxima_dose" name="proxima_dose" type="date" defaultValue={toDateOnly(item?.proxima_dose) ?? ""} /></div>
          <div className="space-y-1"><Label htmlFor="observacoes">Observacoes</Label><Textarea id="observacoes" name="observacoes" defaultValue={item?.observacoes ?? ""} /></div>
        </form>
        <DialogFooter><Button type="submit" form={`vacina-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VacinasTable({ vacinas, pets, atendimentos, canEdit }: { vacinas: Vacina[]; pets: PetOption[]; atendimentos: AtendimentoOption[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("registro");
  const [currentMonth, setCurrentMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));

  const petMap = new Map(pets.map((p) => [p.id, p.nome]));

  const calendarStart = startCalendarGrid(currentMonth);
  const days = useMemo(() => Array.from({ length: 42 }, (_, idx) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + idx);
    return date;
  }), [calendarStart]);

  const aplicacaoByDate = useMemo(() => {
    const map = new Map<string, Vacina[]>();
    for (const item of vacinas) {
      const key = formatDateKey(new Date(item.data_aplicacao));
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [vacinas]);

  const selectedDayItems = aplicacaoByDate.get(selectedDate) ?? [];
  const monthLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const avisos = useMemo(() => {
    const now = new Date();
    const todayEpoch = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);

    return vacinas
      .filter((item) => !!item.proxima_dose)
      .map((item) => {
        const diff = toEpochDayLocal(String(item.proxima_dose)) - todayEpoch;
        return {
          ...item,
          diasParaRetorno: diff
        };
      })
      .sort((a, b) => a.diasParaRetorno - b.diasParaRetorno);
  }, [vacinas]);

  const atrasadas = avisos.filter((x) => x.diasParaRetorno < 0);
  const hoje = avisos.filter((x) => x.diasParaRetorno === 0);
  const proximas7 = avisos.filter((x) => x.diasParaRetorno > 0 && x.diasParaRetorno <= 7);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Vacinas</CardTitle>
          {canEdit ? <VacinaDialog pets={pets} atendimentos={atendimentos} /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={tab === "registro" ? "default" : "outline"} onClick={() => setTab("registro")}>Registro</Button>
          <Button type="button" size="sm" variant={tab === "calendario" ? "default" : "outline"} onClick={() => setTab("calendario")}><CalendarDays className="mr-1 h-4 w-4" />Calendario</Button>
          <Button type="button" size="sm" variant={tab === "avisos" ? "default" : "outline"} onClick={() => setTab("avisos")}><BellRing className="mr-1 h-4 w-4" />Avisos de retorno</Button>
        </div>
      </CardHeader>

      <CardContent>
        {tab === "registro" ? (
          vacinas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma vacina registrada.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Vacina</TableHead><TableHead>Pet</TableHead><TableHead>Aplicacao</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
              <TableBody>
                {vacinas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.fabricante ?? "-"}</p></TableCell>
                    <TableCell>{petMap.get(item.pet_id) ?? "-"}</TableCell>
                    <TableCell>{new Date(item.data_aplicacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-2">
                      <Link href={`/vacinas/${item.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                      {canEdit ? (
                        <>
                          <VacinaDialog item={item} pets={pets} atendimentos={atendimentos} />
                          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => startTransition(async () => {
                            const result = await deleteVacinaAction({ id: item.id });
                            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                          })}><Trash2 className="mr-1 h-4 w-4" />Excluir</Button>
                        </>
                      ) : null}
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : null}

        {tab === "calendario" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Button size="icon" variant="outline" onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="min-w-0 flex-1 text-center text-base font-semibold capitalize sm:min-w-44 sm:text-lg">{monthLabel}</h3>
              <Button size="icon" variant="outline" onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-lg border bg-card p-2 sm:p-3">
                <div className="overflow-x-auto">
                  <div className="min-w-[680px]">
                    <div className="mb-2 grid grid-cols-7 gap-2">
                      {weekDays.map((day) => <p key={day} className="py-1 text-center text-xs font-semibold text-muted-foreground">{day}</p>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day) => {
                        const key = formatDateKey(day);
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                        const isSelected = selectedDate === key;
                        const dayItems = aplicacaoByDate.get(key) ?? [];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDate(key)}
                            className={`min-h-24 rounded-md border p-2 text-left transition ${isSelected ? "border-primary ring-1 ring-primary" : "hover:border-primary/60"} ${isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"}`}
                          >
                            <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
                            <div className="space-y-1">
                              {dayItems.slice(0, 2).map((item) => (
                                <p key={item.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">{item.nome}</p>
                              ))}
                              {dayItems.length > 2 ? <p className="text-[10px] text-muted-foreground">+{dayItems.length - 2} vacinas</p> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-2 sm:p-3">
                <h4 className="mb-2 text-sm font-semibold">Aplicacoes do dia</h4>
                <p className="mb-3 text-xs text-muted-foreground">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                {selectedDayItems.length === 0 ? <p className="text-sm text-muted-foreground">Sem aplicacoes nesta data.</p> : (
                  <div className="space-y-2">
                    {selectedDayItems.map((item) => (
                      <div key={item.id} className="rounded-md border p-2">
                        <p className="text-sm font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">Pet: {petMap.get(item.pet_id) ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">Proxima dose: {item.proxima_dose ? formatDateBR(item.proxima_dose) : "Nao informada"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "avisos" ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Atrasadas</p><p className="text-2xl font-bold text-red-500">{atrasadas.length}</p></div>
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Vencem hoje</p><p className="text-2xl font-bold text-amber-500">{hoje.length}</p></div>
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Proximas 7 dias</p><p className="text-2xl font-bold text-primary">{proximas7.length}</p></div>
            </div>

            {avisos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma vacina com retorno programado.</p> : (
              <div className="space-y-2">
                {avisos.map((item) => {
                  const status = item.diasParaRetorno < 0
                    ? { label: `Atrasada ha ${Math.abs(item.diasParaRetorno)} dia(s)`, classes: "text-red-500" }
                    : item.diasParaRetorno === 0
                      ? { label: "Vence hoje", classes: "text-amber-500" }
                      : item.diasParaRetorno <= 7
                        ? { label: `Vence em ${item.diasParaRetorno} dia(s)`, classes: "text-primary" }
                        : { label: `Retorno em ${item.diasParaRetorno} dia(s)`, classes: "text-muted-foreground" };

                  return (
                    <div key={item.id} className="flex flex-col gap-1 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">Pet: {petMap.get(item.pet_id) ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">Data retorno: {formatDateBR(item.proxima_dose)}</p>
                      </div>
                      <p className={`text-sm font-semibold ${status.classes}`}>{status.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
