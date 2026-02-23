"use client";

import { useTransition } from "react";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/lib/types/db";

type ProfileFormProps = {
  fullName: string;
  workspaceName: string;
  email: string;
  role: UserRole;
};

export function ProfileForm({ fullName, workspaceName, email, role }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => {
            startTransition(async () => {
              const result = await updateProfileAction({
                full_name: String(formData.get("full_name") ?? "")
              });

              toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
            });
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-1">
              <Label>Workspace</Label>
              <Input value={workspaceName} disabled />
            </div>
            <div className="space-y-1">
              <Label>Permissao</Label>
              <Input value={role} disabled />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} required />
          </div>

          <Button disabled={isPending}>{isPending ? "Salvando..." : "Salvar perfil"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
