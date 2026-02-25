"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createAtendimentoAction, deleteAtendimentoAction, updateAtendimentoAction } from "@/actions/atendimentos";
import { uploadAttachmentAction } from "@/actions/attachments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Atendimento } from "@/lib/types/db";

type Opt = { id: string; nome?: string; full_name?: string | null; tutor_id?: string };

function AtendimentoDialog({ item, tutores, pets, vets }: { item?: Atendimento; tutores: Opt[]; pets: Opt[]; vets: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialTutorId = item?.tutor_id ?? tutores[0]?.id ?? "";
  const [selectedTutorId, setSelectedTutorId] = useState(initialTutorId);
  const [selectedPetId, setSelectedPetId] = useState(item?.pet_id ?? "");
  const { toast } = useToast();
  const petsByTutor = useMemo(() => {
    if (!selectedTutorId) return [];
    return pets.filter((pet) => pet.tutor_id === selectedTutorId);
  }, [pets, selectedTutorId]);

  useEffect(() => {
    if (!open) return;
    const defaultTutorId = item?.tutor_id ?? tutores[0]?.id ?? "";
    setSelectedTutorId(defaultTutorId);
    setSelectedPetId(item?.pet_id ?? "");
  }, [open, item?.pet_id, item?.tutor_id, tutores]);

  useEffect(() => {
    if (!open) return;
    if (petsByTutor.length === 0) {
      setSelectedPetId("");
      return;
    }
    const exists = petsByTutor.some((pet) => pet.id === selectedPetId);
    if (!exists) {
      setSelectedPetId(petsByTutor[0]?.id ?? "");
    }
  }, [open, petsByTutor, selectedPetId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo atendimento"}</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{item ? "Editar atendimento" : "Novo atendimento"}</DialogTitle></DialogHeader>
        <form id={`atendimento-form-${item?.id ?? "new"}`} className="space-y-3" action={(formData) => {
          startTransition(async () => {
            const petId = String(formData.get("pet_id") ?? "");
            if (!petId) {
              toast({ title: "Erro", description: "Selecione um pet vinculado ao tutor." });
              return;
            }
            const payload = {
              id: item?.id,
              tutor_id: String(formData.get("tutor_id") ?? ""),
              pet_id: petId,
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
            if (!result.ok) {
              toast({ title: "Erro", description: result.message });
              return;
            }

            const selectedFiles = formData.getAll("attachment");
            const files = selectedFiles.filter((entry): entry is File => entry instanceof File && entry.size > 0);
            if (files.length > 0) {
              const targetAtendimentoId = item?.id
                ?? ("atendimento_id" in result && typeof result.atendimento_id === "string" ? result.atendimento_id : undefined);

              if (!targetAtendimentoId) {
                toast({ title: "Erro", description: "Atendimento salvo, mas falhou ao identificar o registro para anexar o arquivo." });
                setOpen(false);
                return;
              }

              for (const file of files) {
                const attachmentData = new FormData();
                attachmentData.set("atendimento_id", targetAtendimentoId);
                attachmentData.set("file", file);
                const uploadResult = await uploadAttachmentAction(attachmentData);
                if (!uploadResult.ok) {
                  toast({ title: "Erro", description: `Atendimento salvo, mas o anexo "${file.name}" falhou: ${uploadResult.message}` });
                  setOpen(false);
                  return;
                }
              }
            }

            toast({ title: "Sucesso", description: files.length > 0 ? "Atendimento e anexos salvos." : result.message });
            setOpen(false);
          });
        }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Tutor</Label>
              <SearchableSelect
                name="tutor_id"
                value={selectedTutorId}
                onValueChange={setSelectedTutorId}
                searchPlaceholder="Buscar tutor..."
                options={tutores.map((tutor) => ({ value: tutor.id, label: tutor.nome ?? "Sem nome" }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Pet</Label>
              <SearchableSelect
                name="pet_id"
                value={selectedPetId}
                onValueChange={setSelectedPetId}
                disabled={petsByTutor.length === 0}
                searchPlaceholder="Buscar pet..."
                emptyLabel="Nenhum pet para este tutor"
                options={petsByTutor.map((pet) => ({ value: pet.id, label: pet.nome ?? "Sem nome" }))}
              />
              {petsByTutor.length === 0 ? (
                <p className="text-xs text-muted-foreground">Este tutor nao possui pets cadastrados.</p>
              ) : null}
            </div>
            <div className="space-y-1"><Label>Veterinario</Label><Select name="veterinario_id" defaultValue={item?.veterinario_id ?? vets[0]?.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.full_name ?? "Sem nome"}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-1"><Label>Queixa principal</Label><Textarea name="queixa_principal" defaultValue={item?.queixa_principal ?? ""} /></div>
          <div className="space-y-1"><Label>Anamnese</Label><Textarea name="anamnese" defaultValue={item?.anamnese ?? ""} /></div>
          <div className="space-y-1"><Label>Diagnostico</Label><Textarea name="diagnostico" defaultValue={item?.diagnostico ?? ""} /></div>
          <div className="space-y-1"><Label>Conduta</Label><Textarea name="conduta" defaultValue={item?.conduta ?? ""} /></div>
          <div className="space-y-1"><Label>Prescricao</Label><Textarea name="prescricao" defaultValue={item?.prescricao ?? ""} /></div>
          <div className="space-y-1"><Label>Retorno em</Label><input className="w-full rounded-md border px-3 py-2 text-sm" name="retorno_em" type="date" defaultValue={item?.retorno_em ?? ""} /></div>
          <div className="space-y-1">
            <Label htmlFor="attachment">Documentos (opcional)</Label>
            <Input id="attachment" name="attachment" type="file" multiple />
            <p className="text-xs text-muted-foreground">Aceita qualquer tipo de documento. Voce pode selecionar varios arquivos.</p>
          </div>
        </form>
        <DialogFooter><Button type="submit" form={`atendimento-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AtendimentosTable({ items, tutores, pets, vets, canEdit }: { items: Atendimento[]; tutores: Opt[]; pets: Opt[]; vets: Opt[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const petMap = useMemo(() => new Map(pets.map((x) => [x.id, x.nome])), [pets]);
  const tutorMap = useMemo(() => new Map(tutores.map((x) => [x.id, x.nome])), [tutores]);
  const vetMap = useMemo(() => new Map(vets.map((x) => [x.id, x.full_name ?? "Sem nome"])), [vets]);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;
    return items.filter((item) =>
      [
        petMap.get(item.pet_id) ?? "",
        tutorMap.get(item.tutor_id) ?? "",
        vetMap.get(item.veterinario_id) ?? "",
        item.queixa_principal ?? "",
        item.anamnese ?? "",
        item.diagnostico ?? "",
        item.conduta ?? "",
        item.prescricao ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [items, normalizedSearch, petMap, tutorMap, vetMap]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Atendimentos</CardTitle>
        {canEdit ? <AtendimentoDialog tutores={tutores} pets={pets} vets={vets} /> : null}
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por pet, tutor, diagnostico..."
          />
        </div>
        {filteredItems.length === 0 ? <p className="text-sm text-muted-foreground">{items.length === 0 ? "Sem atendimentos." : "Nenhum atendimento encontrado."}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pet</TableHead><TableHead>Diagnostico</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
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
