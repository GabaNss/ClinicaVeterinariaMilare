import Link from "next/link";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type TopbarProps = {
  userName: string;
  workspaceName: string;
  themePreference: "light" | "dark";
};

export function Topbar({ userName, workspaceName, themePreference }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-black/10 bg-background/85 px-3 backdrop-blur sm:h-16 sm:px-4 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">Workspace</p>
        <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{workspaceName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle initialTheme={themePreference} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <span className="hidden max-w-[110px] truncate sm:inline">{userName}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex w-full items-center gap-2">
                <UserCircle2 className="h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/logout" className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
