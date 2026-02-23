"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createAgendaAction, deleteAgendaAction, updateAgendaAction } from "@/actions/agenda";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { AgendaItem } from "@/lib/types/db";

type Option = { id: string; nome?: string; full_name?: string | null };
type OwnerOption = { id: string; nome: string; total: number };
type UserOption = { id: string; nome: string };
type AgendaView = "personal" | "general";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function formatDateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateKeyFromIso(value: string) {
  return formatDateKey(new Date(value));
}

function monthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startCalendarGrid(value: Date) {
  const start = monthStart(value);
  const mondayOffset = (start.getDay() + 6) % 7;
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() - mondayOffset);
}

function AgendaDialog({
  item,
  tutores,
  pets,
  vets,
  defaultDate
}: {
  item?: AgendaItem;
  tutores: Option[];
  pets: Option[];
  vets: Option[];
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const initialDateTime = item?.data_hora?.slice(0, 16) ?? (defaultDate ? `${defaultDate}T09:00` : "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo evento"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar agenda" : "Novo evento"}</DialogTitle></DialogHeader>
        <form
          id={`agenda-form-${item?.id ?? "new"}`}
          className="space-y-3"
          action={(formData) => {
            startTransition(async () => {
              const vet = String(formData.get("veterinario_id") ?? "none");
              const payload = {
                id: item?.id,
                tutor_id: String(formData.get("tutor_id") ?? ""),
                pet_id: String(formData.get("pet_id") ?? ""),
                veterinario_id: vet === "none" ? null : vet,
                titulo: String(formData.get("titulo") ?? ""),
                descricao: String(formData.get("descricao") ?? ""),
                data_hora: String(formData.get("data_hora") ?? ""),
                status: String(formData.get("status") ?? "AGENDADO")
              };
              const result = item ? await updateAgendaAction(payload) : await createAgendaAction(payload);
              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
              if (result.ok) setOpen(false);
            });
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Tutor</Label><Select name="tutor_id" defaultValue={item?.tutor_id ?? tutores[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tutores.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Pet</Label><Select name="pet_id" defaultValue={item?.pet_id ?? pets[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1"><Label>Veterinario</Label><Select name="veterinario_id" defaultValue={item?.veterinario_id ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nao atribuido</SelectItem>{vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.full_name ?? "Sem nome"}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label htmlFor="titulo">Titulo</Label><Input id="titulo" name="titulo" defaultValue={item?.titulo ?? ""} required /></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="data_hora">Data e hora</Label><Input id="data_hora" name="data_hora" type="datetime-local" defaultValue={initialDateTime} required /></div>
            <div className="space-y-1"><Label>Status</Label><Select name="status" defaultValue={item?.status ?? "AGENDADO"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["AGENDADO", "CONFIRMADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1"><Label htmlFor="descricao">Descricao</Label><Input id="descricao" name="descricao" defaultValue={item?.descricao ?? ""} /></div>
        </form>
        <DialogFooter><Button type="submit" form={`agenda-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AgendaTable({
  items,
  tutores,
  pets,
  vets,
  canEdit,
  isAdmin,
  currentUserId,
  users
}: {
  items: AgendaItem[];
  tutores: Option[];
  pets: Option[];
  vets: Option[];
  canEdit: boolean;
  isAdmin: boolean;
  currentUserId: string;
  users: UserOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [ownerFilter, setOwnerFilter] = useState<string>("me");
  const [view, setView] = useState<AgendaView>("personal");

  const tutorMap = new Map(tutores.map((x) => [x.id, x.nome]));
  const petMap = new Map(pets.map((x) => [x.id, x.nome]));
  const calendarStart = startCalendarGrid(currentMonth);

  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + idx);
      return date;
    });
  }, [calendarStart]);

  const ownerOptions = useMemo<OwnerOption[]>(() => {
    const counts = new Map<string, OwnerOption>(
      users.map((user) => [user.id, { id: user.id, nome: user.nome || "Sem nome", total: 0 }])
    );
    for (const item of items) {
      const ownerName = item.created_by_name || "Usuario";
      const existing = counts.get(item.created_by);
      if (existing) {
        if (!existing.nome || existing.nome === "Sem nome") {
          existing.nome = ownerName;
        }
        existing.total += 1;
      } else {
        counts.set(item.created_by, { id: item.created_by, nome: ownerName, total: 1 });
      }
    }
    return Array.from(counts.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [items, users]);

  const visibleItems = useMemo(() => {
    if (view === "general") return items;
    if (!isAdmin) return items.filter((item) => item.created_by === currentUserId || item.veterinario_id === currentUserId);
    if (ownerFilter === "all") return items;
    if (ownerFilter === "me") return items.filter((item) => item.created_by === currentUserId || item.veterinario_id === currentUserId);
    return items.filter((item) => item.created_by === ownerFilter || item.veterinario_id === ownerFilter);
  }, [currentUserId, isAdmin, items, ownerFilter, view]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of visibleItems) {
      const key = toDateKeyFromIso(item.data_hora);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const entry of map.values()) {
      entry.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    }
    return map;
  }, [visibleItems]);

  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const monthLabel = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-0 flex-1 text-center text-base font-semibold capitalize sm:min-w-44 sm:text-lg">{monthLabel}</h3>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {canEdit ? <AgendaDialog tutores={tutores} pets={pets} vets={vets} defaultDate={selectedDate} /> : null}
      </div>

      <div className="space-y-2 rounded-md border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={view === "personal" ? "default" : "outline"} onClick={() => setView("personal")}>Agenda pessoal</Button>
          <Button type="button" size="sm" variant={view === "general" ? "default" : "outline"} onClick={() => setView("general")}>Agenda geral</Button>
        </div>
        {view === "personal" ? (
          isAdmin ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Visao do administrador</p>
                <p className="text-xs text-muted-foreground">Na agenda pessoal, selecione o usuario para ver os compromissos.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant={ownerFilter === "all" ? "default" : "outline"} onClick={() => setOwnerFilter("all")}>Todos</Button>
                <Button type="button" size="sm" variant={ownerFilter === "me" ? "default" : "outline"} onClick={() => setOwnerFilter("me")}>Meus</Button>
                <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">Todos os usuarios</option>
                  <option value="me">Apenas meus eventos</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>{owner.nome} ({owner.total})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Exibindo apenas seus compromissos.</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground">Agenda geral com visualizacao completa de todos os compromissos.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border bg-card p-2 sm:p-3">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="mb-2 grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <p key={day} className="py-1 text-center text-xs font-semibold text-muted-foreground">{day}</p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const key = formatDateKey(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = selectedDate === key;
                  const dayItems = itemsByDate.get(key) ?? [];

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
                          <p key={item.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">{new Date(item.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} {item.titulo}</p>
                        ))}
                        {dayItems.length > 2 ? <p className="text-[10px] text-muted-foreground">+{dayItems.length - 2} compromissos</p> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-2 sm:p-3">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Compromissos do dia</h4>
            <p className="text-xs text-muted-foreground">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR")}</p>
          </div>
          {selectedItems.length === 0 ? <p className="text-sm text-muted-foreground">Sem compromissos para esta data.</p> : (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="rounded-md border p-2">
                  <p className="text-sm font-medium">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - {item.status}
                  </p>
                  <p className="text-xs text-muted-foreground">{tutorMap.get(item.tutor_id)} / {petMap.get(item.pet_id)}</p>
                  {isAdmin ? <p className="text-xs text-muted-foreground">Responsavel: {item.created_by_name || "Usuario"}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/agenda/${item.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                    {canEdit ? (
                      <>
                        <AgendaDialog item={item} tutores={tutores} pets={pets} vets={vets} />
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => startTransition(async () => {
                            const result = await deleteAgendaAction({ id: item.id });
                            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                          })}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />Excluir
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
