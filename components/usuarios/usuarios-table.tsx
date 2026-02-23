"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAccountAction, updateUserApprovalAction, updateUserRoleAction } from "@/actions/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Profile, UserRole } from "@/lib/types/db";

export function UsuariosTable({ users, canManage }: { users: Profile[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [tab, setTab] = useState<"permissoes" | "autorizacao">("permissoes");
  const pendingUsers = useMemo(() => users.filter((user) => !user.is_approved), [users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios e Permissoes</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={tab === "permissoes" ? "default" : "outline"} onClick={() => setTab("permissoes")}>
            Permissoes
          </Button>
          {canManage ? (
            <Button type="button" size="sm" variant={tab === "autorizacao" ? "default" : "outline"} onClick={() => setTab("autorizacao")}>
              Autorizacao
              {pendingUsers.length > 0 ? <span className="ml-2 rounded bg-background/20 px-1.5 py-0.5 text-[10px]">{pendingUsers.length}</span> : null}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {tab === "permissoes" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name ?? "Sem nome"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.is_approved ? <Badge variant="success">Autorizado</Badge> : <Badge variant="warning">Pendente</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/usuarios/${user.id}`}>
                        <Button size="sm" variant="outline">Detalhes</Button>
                      </Link>
                      {canManage ? (
                        <>
                          <Select
                            disabled={isPending}
                            defaultValue={user.role}
                            onValueChange={(value: UserRole) => {
                              startTransition(async () => {
                                const result = await updateUserRoleAction({ id: user.id, role: value });
                                toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                              });
                            }}
                          >
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="VETERINARIO">VETERINARIO</SelectItem>
                              <SelectItem value="ESTAGIARIO">ESTAGIARIO</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => {
                              const confirmed = window.confirm(`Deseja excluir a conta de ${user.full_name ?? "Sem nome"}? Esta acao nao pode ser desfeita.`);
                              if (!confirmed) return;
                              startTransition(async () => {
                                const result = await deleteUserAccountAction({ id: user.id });
                                toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                              });
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />Excluir conta
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" disabled>Somente leitura</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {canManage && tab === "autorizacao" ? (
          pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario pendente de autorizacao.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Role inicial</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name ?? "Sem nome"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await updateUserApprovalAction({ id: user.id, approved: true });
                            toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                          });
                        }}
                      >
                        Autorizar acesso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
