"use client";

import { useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { setThemePreferenceAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ThemeToggleProps = {
  initialTheme: "light" | "dark";
};

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function applyTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);

    startTransition(async () => {
      const result = await setThemePreferenceAction({ theme_preference: nextTheme });
      if (!result.ok) {
        applyTheme(theme);
        toast({ title: "Erro", description: result.message });
      }
    });
  }

  return (
    <Button
      size="icon"
      variant="outline"
      type="button"
      onClick={toggleTheme}
      disabled={isPending}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
