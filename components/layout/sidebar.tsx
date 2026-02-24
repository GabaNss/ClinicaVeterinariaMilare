"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Boxes, CalendarClock, Dog, FileText, LayoutDashboard, ShieldCheck, Syringe, Users, Wallet, UserCog } from "lucide-react";
import type { UserRole } from "@/lib/types/db";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tutores", label: "Tutores", icon: Users },
  { href: "/pets", label: "Pets", icon: Dog },
  { href: "/atendimentos", label: "Atendimentos", icon: FileText },
  { href: "/agenda", label: "Agenda", icon: CalendarClock },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/vacinas", label: "Vacinas", icon: Syringe },
  { href: "/usuarios", label: "Permissoes", icon: ShieldCheck },
  { href: "/profile", label: "Perfil", icon: UserCog }
];

function canSeeLink(role: UserRole, href: string) {
  if (role !== "ADMIN" && href === "/usuarios") return false;
  if (role === "ESTAGIARIO" && href === "/financeiro") return false;
  return true;
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => canSeeLink(role, link.href));

  return (
    <>
      <aside className="hidden w-64 border-r border-black/15 bg-card/90 p-4 backdrop-blur md:block dark:border-white/10">
        <div className="mb-6 flex w-full items-center justify-center">
          <Image src="/logo/Logo.jpg" alt="Logo da clinica" width={220} height={120} className="h-auto w-full rounded-md object-contain dark:hidden" />
          <Image src="/logo/LogoPreto.png" alt="Logo da clinica no modo escuro" width={220} height={120} className="hidden h-auto w-full rounded-md object-contain dark:block" />
        </div>
        <nav className="space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/15 bg-card/95 px-2 py-1 backdrop-blur md:hidden dark:border-white/10">
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-w-[70px] flex-1 flex-col items-center justify-center rounded-md px-2 py-2 text-[10px] font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
