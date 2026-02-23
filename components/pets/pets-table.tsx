"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createPetAction, deletePetAction, updatePetAction } from "@/actions/pets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Pet } from "@/lib/types/db";

type TutorOption = { id: string; nome: string };

function PetDialog({ pet, tutores }: { pet?: Pet; tutores: TutorOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={pet ? "outline" : "default"}>{pet ? "Editar" : "Novo pet"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pet ? "Editar pet" : "Novo pet"}</DialogTitle>
        </DialogHeader>
        <form
          id={`pet-form-${pet?.id ?? "new"}`}
          className="space-y-3"
          action={(formData) => {
            startTransition(async () => {
              const weightRaw = String(formData.get("peso_kg") ?? "").trim();
              const payload = {
                id: pet?.id,
                tutor_id: String(formData.get("tutor_id") ?? ""),
                nome: String(formData.get("nome") ?? ""),
                especie: String(formData.get("especie") ?? ""),
                raca: String(formData.get("raca") ?? ""),
                sexo: String(formData.get("sexo") ?? ""),
                cor: String(formData.get("cor") ?? ""),
                data_nascimento: String(formData.get("data_nascimento") ?? ""),
                peso_kg: weightRaw ? Number(weightRaw) : undefined,
                microchip: String(formData.get("microchip") ?? ""),
                observacoes: String(formData.get("observacoes") ?? "")
              };

              const result = pet ? await updatePetAction(payload) : await createPetAction(payload);
              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
              if (result.ok) setOpen(false);
            });
          }}
        >
          <div className="space-y-1">
            <Label>Tutor</Label>
            <Select name="tutor_id" defaultValue={pet?.tutor_id ?? tutores[0]?.id}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tutores.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>{tutor.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" defaultValue={pet?.nome ?? ""} required /></div>
            <div className="space-y-1"><Label htmlFor="especie">Especie</Label><Input id="especie" name="especie" defaultValue={pet?.especie ?? ""} required /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="raca">Raca</Label><Input id="raca" name="raca" defaultValue={pet?.raca ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="sexo">Sexo</Label><Input id="sexo" name="sexo" defaultValue={pet?.sexo ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="cor">Cor</Label><Input id="cor" name="cor" defaultValue={pet?.cor ?? ""} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="data_nascimento">Nascimento</Label><Input id="data_nascimento" name="data_nascimento" type="date" defaultValue={pet?.data_nascimento ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="peso_kg">Peso (kg)</Label><Input id="peso_kg" name="peso_kg" type="number" step="0.001" defaultValue={pet?.peso_kg ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="microchip">Microchip</Label><Input id="microchip" name="microchip" defaultValue={pet?.microchip ?? ""} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="observacoes">Observacoes</Label><Textarea id="observacoes" name="observacoes" defaultValue={pet?.observacoes ?? ""} /></div>
        </form>
        <DialogFooter>
          <Button type="submit" form={`pet-form-${pet?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PetsTable({ pets, tutores, canEdit }: { pets: Pet[]; tutores: TutorOption[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const tutorMap = new Map(tutores.map((t) => [t.id, t.nome]));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Pets</CardTitle>
        {canEdit ? <PetDialog tutores={tutores} /> : null}
      </CardHeader>
      <CardContent>
        {pets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pet cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell>
                    <p className="font-medium">{pet.nome}</p>
                    <p className="text-xs text-muted-foreground">{pet.especie} {pet.raca ? `- ${pet.raca}` : ""}</p>
                  </TableCell>
                  <TableCell>{tutorMap.get(pet.tutor_id) ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/pets/${pet.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                      {canEdit ? (
                        <>
                          <PetDialog pet={pet} tutores={tutores} />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                const result = await deletePetAction({ id: pet.id });
                                toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                              });
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Excluir
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
