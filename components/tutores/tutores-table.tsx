"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createTutorAction, deleteTutorAction, updateTutorAction } from "@/actions/tutores";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCpfCnpj, formatPhone } from "@/lib/masks";
import type { Tutor } from "@/lib/types/db";

function TutorDialog({ tutor }: { tutor?: Tutor }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={tutor ? "outline" : "default"}>{tutor ? "Editar" : "Novo tutor"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tutor ? "Editar tutor" : "Novo tutor"}</DialogTitle>
        </DialogHeader>
        <form
          id="tutor-form"
          className="space-y-3"
          action={(formData) => {
            startTransition(async () => {
              const payload = {
                id: tutor?.id,
                nome: String(formData.get("nome") ?? ""),
                cpf_cnpj: String(formData.get("cpf_cnpj") ?? ""),
                telefone: String(formData.get("telefone") ?? ""),
                endereco: String(formData.get("endereco") ?? ""),
                observacoes: String(formData.get("observacoes") ?? "")
              };

              const result = tutor ? await updateTutorAction(payload) : await createTutorAction(payload);
              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
              if (result.ok) setOpen(false);
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={tutor?.nome ?? ""} required />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                id="cpf_cnpj"
                name="cpf_cnpj"
                defaultValue={formatCpfCnpj(tutor?.cpf_cnpj ?? "")}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                onInput={(e) => {
                  e.currentTarget.value = formatCpfCnpj(e.currentTarget.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={formatPhone(tutor?.telefone ?? "")}
                placeholder="(00) 00000-0000"
                onInput={(e) => {
                  e.currentTarget.value = formatPhone(e.currentTarget.value);
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="endereco">Endereco</Label>
            <Input id="endereco" name="endereco" defaultValue={tutor?.endereco ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={tutor?.observacoes ?? ""} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="tutor-form" disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TutoresTable({ tutores, canEdit }: { tutores: Tutor[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTutores = useMemo(() => {
    if (!normalizedSearch) return tutores;
    return tutores.filter((tutor) =>
      [tutor.nome, tutor.cpf_cnpj ?? "", tutor.telefone ?? "", tutor.endereco ?? "", tutor.observacoes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [tutores, normalizedSearch]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Tutores</CardTitle>
        {canEdit ? <TutorDialog /> : null}
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar tutor por nome, CPF/CNPJ, telefone..."
          />
        </div>
        {filteredTutores.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tutores.length === 0 ? "Nenhum tutor cadastrado." : "Nenhum tutor encontrado."}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTutores.map((tutor) => (
                <TableRow key={tutor.id}>
                  <TableCell>
                    <p className="font-medium">{tutor.nome}</p>
                    <p className="text-xs text-muted-foreground">{tutor.cpf_cnpj ? formatCpfCnpj(tutor.cpf_cnpj) : "-"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{tutor.telefone ? formatPhone(tutor.telefone) : "-"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/tutores/${tutor.id}`}>
                        <Button size="sm" variant="outline">Detalhes</Button>
                      </Link>
                      {canEdit ? (
                        <>
                          <TutorDialog tutor={tutor} />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                const result = await deleteTutorAction({ id: tutor.id });
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
