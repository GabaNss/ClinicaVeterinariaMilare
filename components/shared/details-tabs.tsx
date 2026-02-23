"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DetailsTabs({ details, audit }: { details: React.ReactNode; audit: React.ReactNode }) {
  const [tab, setTab] = useState<"detalhes" | "auditoria">("detalhes");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant={tab === "detalhes" ? "default" : "outline"} onClick={() => setTab("detalhes")}>
          Detalhes
        </Button>
        <Button type="button" size="sm" variant={tab === "auditoria" ? "default" : "outline"} onClick={() => setTab("auditoria")}>
          Auditoria
        </Button>
      </div>
      {tab === "detalhes" ? details : audit}
    </div>
  );
}
