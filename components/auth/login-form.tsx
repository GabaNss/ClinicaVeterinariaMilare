"use client";

import { useEffect, useState, useTransition } from "react";
import { forgotPasswordAction, signInAction, signUpAction } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

export function LoginForm({ reason }: { reason?: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("remembered_email");
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
    }
  }, []);

  async function onSubmit(formData: FormData) {
    const emailInput = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("full_name") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const remember = formData.get("remember_me") === "on";

    if (remember) {
      window.localStorage.setItem("remembered_email", emailInput);
    } else {
      window.localStorage.removeItem("remembered_email");
    }

    startTransition(async () => {
      const result = mode === "login"
        ? await signInAction({ email: emailInput, password })
        : await signUpAction({ email: emailInput, password, full_name: fullName, phone });

      if (!result.ok) {
        toast({ title: "Erro", description: result.message });
        return;
      }

      if (mode === "signup") {
        toast({ title: "Sucesso", description: result.message });
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Gerenciamento</CardTitle>
        <CardDescription>Entre com email e senha</CardDescription>
        {reason === "profile_missing" ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Seu perfil nao foi encontrado no banco atual. Execute a migration SQL mais recente no Supabase.
          </p>
        ) : null}
        {reason === "pending_approval" ? (
          <p className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Sua conta foi criada e esta aguardando aprovacao de um administrador para liberar o acesso.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")} type="button">
            Entrar
          </Button>
          <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")} type="button">
            Criar conta
          </Button>
        </div>

        <form action={onSubmit} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" placeholder="Seu nome completo" required />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={signupPhone}
                onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {mode === "login" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="remember_me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Lembrar de mim
            </label>
          ) : null}
          {mode === "login" ? (
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-xs"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await forgotPasswordAction({ email });
                  toast({ title: result.ok ? "Sucesso" : "Erro", description: result.message });
                });
              }}
            >
              Esqueci minha senha
            </Button>
          ) : null}
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
