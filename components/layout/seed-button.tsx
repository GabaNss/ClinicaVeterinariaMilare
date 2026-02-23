"use client";

import { useTransition } from "react";
import { seedWorkspaceDataAction } from "@/actions/seed";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SeedButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await seedWorkspaceDataAction();
          toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
        });
      }}
    >
      {isPending ? "Gerando..." : "Gerar dados de exemplo"}
    </Button>
  );
}
