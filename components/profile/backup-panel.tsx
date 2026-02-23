"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ShieldCheck } from "lucide-react";
import { createWorkspaceBackupAction, downloadWorkspaceBackupAction, restoreWorkspaceFromUploadAction } from "@/actions/backups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { WorkspaceBackup } from "@/lib/types/db";

export function BackupPanel({ backups }: { backups: WorkspaceBackup[] }) {
  const [isPending, startTransition] = useTransition();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  function downloadTextFile(fileName: string, content: string) {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Backup Seguro (ADMIN)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Gera um snapshot completo dos dados do workspace com checksum SHA-256.</p>
        </div>
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await createWorkspaceBackupAction();
              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
              if (result.ok) router.refresh();
            });
          }}
        >
          {isPending ? "Gerando..." : "Gerar backup"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Restaurar backup (.json)</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              className="block w-full text-sm"
              disabled={isPending}
            />
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                const file = restoreInputRef.current?.files?.[0];
                if (!file) {
                  toast({ title: "Erro", description: "Selecione um arquivo de backup" });
                  return;
                }

                const formData = new FormData();
                formData.append("file", file);

                startTransition(async () => {
                  const result = await restoreWorkspaceFromUploadAction(formData);
                  if (!result.ok) {
                    toast({ title: "Erro", description: result.message });
                    return;
                  }

                  const resumo = Object.entries(result.restored).map(([table, total]) => `${table}: ${total}`).join(" | ");
                  toast({ title: "Sucesso", description: `${result.message}. ${resumo}` });
                  if (restoreInputRef.current) restoreInputRef.current.value = "";
                  router.refresh();
                });
              }}
            >
              {isPending ? "Restaurando..." : "Restaurar backup"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">A restauracao faz merge por ID (upsert) nas tabelas principais do workspace atual.</p>
        </div>

        {backups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum backup gerado ainda.</p>
        ) : (
          backups.map((backup) => (
            <div key={backup.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">{backup.file_name}</p>
                <p className="text-xs text-muted-foreground">Criado em {new Date(backup.created_at).toLocaleString("pt-BR")}</p>
                <p className="text-[11px] text-muted-foreground">Checksum: {backup.checksum_sha256}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await downloadWorkspaceBackupAction({ id: backup.id });
                    if (!result.ok) {
                      toast({ title: "Erro", description: result.message });
                      return;
                    }
                    downloadTextFile(result.fileName, result.content);
                    toast({ title: "Sucesso", description: "Backup baixado com sucesso" });
                  });
                }}
              >
                <Download className="mr-1 h-4 w-4" />
                Baixar
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
