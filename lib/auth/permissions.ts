import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/db";
import { requireUser } from "@/lib/auth/requireUser";

export async function requireRole(roles: UserRole[]) {
  const context = await requireUser();
  if (!roles.includes(context.profile.role)) {
    redirect("/dashboard?error=permissao");
  }
  return context;
}

export function canEditByRole(role: UserRole, entity: "tutores" | "pets" | "agenda" | "atendimentos" | "vacinas" | "financeiro" | "usuarios" | "estoque") {
  if (role === "ADMIN") return true;
  if (entity === "usuarios") return false;

  if (role === "VETERINARIO") {
    return true;
  }

  if (role === "ESTAGIARIO") {
    return entity === "tutores" || entity === "pets" || entity === "agenda" || entity === "estoque";
  }

  return false;
}

export function canViewFinanceiro(role: UserRole) {
  return role === "ADMIN" || role === "VETERINARIO";
}

export function canViewPermissoes(role: UserRole) {
  return role === "ADMIN";
}
