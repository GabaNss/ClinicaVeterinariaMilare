"use client";

import { ToastProviderClient } from "@/hooks/use-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProviderClient>{children}</ToastProviderClient>;
}
