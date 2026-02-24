import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@/app/globals.css";
import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Sistema Veterinario",
  description: "Controle completo de clinica veterinaria com auditoria",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = cookies().get("theme")?.value === "dark" ? "dark" : "";

  return (
    <html lang="pt-BR" className={theme}>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
