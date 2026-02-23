"use client";

import * as React from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
};

type ToastContext = {
  toasts: ToastProps[];
  toast: (toast: Omit<ToastProps, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContext | null>(null);

export function ToastProviderClient({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((value: Omit<ToastProps, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, duration: 3500, ...value }]);
    setTimeout(() => dismiss(id), value.duration ?? 3500);
  }, [dismiss]);

  return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProviderClient");
  }

  return context;
}
