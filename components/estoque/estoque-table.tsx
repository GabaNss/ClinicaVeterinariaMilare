"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { createEstoqueAction, deleteEstoqueAction, updateEstoqueAction } from "@/actions/estoque";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { EstoqueItem } from "@/lib/types/db";

function EstoqueDialog({ item }: { item?: EstoqueItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant={item ? "outline" : "default"}>{item ? "Editar" : "Novo item"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar item de estoque" : "Novo item de estoque"}</DialogTitle></DialogHeader>
        <form
          id={`estoque-form-${item?.id ?? "new"}`}
          className="space-y-3"
          action={(formData) => {
            startTransition(async () => {
              const payload = {
                id: item?.id,
                nome: String(formData.get("nome") ?? ""),
                categoria: String(formData.get("categoria") ?? ""),
                sku: String(formData.get("sku") ?? ""),
                unidade: String(formData.get("unidade") ?? "UN"),
                quantidade_atual: Number(formData.get("quantidade_atual") ?? 0),
                quantidade_minima: Number(formData.get("quantidade_minima") ?? 0),
                custo_medio: String(formData.get("custo_medio") ?? ""),
                valor_venda: String(formData.get("valor_venda") ?? ""),
                validade: String(formData.get("validade") ?? ""),
                lote: String(formData.get("lote") ?? ""),
                fornecedor: String(formData.get("fornecedor") ?? ""),
                observacoes: String(formData.get("observacoes") ?? "")
              };
              const result = item ? await updateEstoqueAction(payload) : await createEstoqueAction(payload);
              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
              if (result.ok) setOpen(false);
            });
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" defaultValue={item?.nome ?? ""} required /></div>
            <div className="space-y-1"><Label htmlFor="categoria">Categoria</Label><Input id="categoria" name="categoria" defaultValue={item?.categoria ?? ""} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" defaultValue={item?.sku ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="unidade">Unidade</Label><Input id="unidade" name="unidade" defaultValue={item?.unidade ?? "UN"} required /></div>
            <div className="space-y-1"><Label htmlFor="validade">Validade</Label><Input id="validade" name="validade" type="date" defaultValue={item?.validade ?? ""} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1"><Label htmlFor="quantidade_atual">Quantidade atual</Label><Input id="quantidade_atual" name="quantidade_atual" type="number" step="0.001" defaultValue={item?.quantidade_atual ?? 0} required /></div>
            <div className="space-y-1"><Label htmlFor="quantidade_minima">Quantidade minima</Label><Input id="quantidade_minima" name="quantidade_minima" type="number" step="0.001" defaultValue={item?.quantidade_minima ?? 0} required /></div>
            <div className="space-y-1"><Label htmlFor="custo_medio">Custo medio</Label><Input id="custo_medio" name="custo_medio" type="number" step="0.01" defaultValue={item?.custo_medio ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="valor_venda">Valor venda</Label><Input id="valor_venda" name="valor_venda" type="number" step="0.01" defaultValue={item?.valor_venda ?? ""} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="lote">Lote</Label><Input id="lote" name="lote" defaultValue={item?.lote ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="fornecedor">Fornecedor</Label><Input id="fornecedor" name="fornecedor" defaultValue={item?.fornecedor ?? ""} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="observacoes">Observacoes</Label><Input id="observacoes" name="observacoes" defaultValue={item?.observacoes ?? ""} /></div>
        </form>
        <DialogFooter><Button type="submit" form={`estoque-form-${item?.id ?? "new"}`} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EstoqueTable({ items, canEdit }: { items: EstoqueItem[]; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const itensBaixos = useMemo(() => items.filter((item) => Number(item.quantidade_atual) <= Number(item.quantidade_minima)).length, [items]);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Controle de estoque</h3>
          {itensBaixos > 0 ? <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" />{itensBaixos} abaixo do minimo</Badge> : <Badge variant="secondary">Sem alertas</Badge>}
        </div>
        {canEdit ? <EstoqueDialog /> : null}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Categoria</TableHead><TableHead>Estoque</TableHead><TableHead>Valores</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((item) => {
              const abaixo = Number(item.quantidade_atual) <= Number(item.quantidade_minima);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku ?? "-"}</p>
                  </TableCell>
                  <TableCell>{item.categoria ?? "-"}</TableCell>
                  <TableCell>
                    <p>{Number(item.quantidade_atual).toFixed(3)} {item.unidade}</p>
                    <p className={`text-xs ${abaixo ? "text-destructive" : "text-muted-foreground"}`}>Minimo: {Number(item.quantidade_minima).toFixed(3)}</p>
                  </TableCell>
                  <TableCell>
                    <p>Custo: {item.custo_medio === null ? "-" : `R$ ${Number(item.custo_medio).toFixed(2)}`}</p>
                    <p className="text-xs text-muted-foreground">Venda: {item.valor_venda === null ? "-" : `R$ ${Number(item.valor_venda).toFixed(2)}`}</p>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-2">
                        <EstoqueDialog item={item} />
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => startTransition(async () => {
                            const result = await deleteEstoqueAction({ id: item.id });
                            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                          })}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />Excluir
                        </Button>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Somente leitura</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
