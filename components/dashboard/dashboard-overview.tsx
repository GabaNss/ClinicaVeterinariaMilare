"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/db/dashboard";
import type { UserRole } from "@/lib/types/db";

function moeda(valor: number) {
  return `R$ ${valor.toFixed(2)}`;
}

type Periodo = "diario" | "semanal" | "mensal";

export function DashboardOverview({ stats, role }: { stats: DashboardStats; role: UserRole }) {
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const canSeeMoney = role !== "ESTAGIARIO";

  const lucroAtual = useMemo(() => {
    return stats.lucro[periodo];
  }, [periodo, stats.lucro]);

  const margem = lucroAtual.ganhos > 0 ? (lucroAtual.lucro / lucroAtual.ganhos) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Tutores</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold sm:text-3xl">{stats.totais.tutores}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pets</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold sm:text-3xl">{stats.totais.pets}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Atendimentos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold sm:text-3xl">{stats.totais.atendimentos}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agenda Hoje</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold sm:text-3xl">{stats.totais.agendaHoje}</p></CardContent>
        </Card>
      </div>

      {canSeeMoney ? (
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Lucro (Ganhos - Gastos)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPeriodo("diario")} className={`rounded-md border px-3 py-1 text-sm ${periodo === "diario" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Diario</button>
              <button type="button" onClick={() => setPeriodo("semanal")} className={`rounded-md border px-3 py-1 text-sm ${periodo === "semanal" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Semanal</button>
              <button type="button" onClick={() => setPeriodo("mensal")} className={`rounded-md border px-3 py-1 text-sm ${periodo === "mensal" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Mensal</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Ganhos</p>
                <p className="text-2xl font-bold">{moeda(lucroAtual.ganhos)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold">{moeda(lucroAtual.gastos)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`text-2xl font-bold ${lucroAtual.lucro >= 0 ? "text-green-600" : "text-red-500"}`}>{moeda(lucroAtual.lucro)}</p>
                <p className="text-xs text-muted-foreground">Margem: {margem.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {canSeeMoney ? (
          <Card>
            <CardHeader><CardTitle>Financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Receita pendente</span>
                <Badge variant="success">{moeda(stats.financeiro.receitaPendente)}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Despesa pendente</span>
                <Badge variant="warning">{moeda(stats.financeiro.despesaPendente)}</Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle>Agenda de Hoje</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md border p-2">Agendado: <strong>{stats.agendaHojeResumo.agendado}</strong></div>
            <div className="rounded-md border p-2">Confirmado: <strong>{stats.agendaHojeResumo.confirmado}</strong></div>
            <div className="rounded-md border p-2">Em atendimento: <strong>{stats.agendaHojeResumo.emAtendimento}</strong></div>
            <div className="rounded-md border p-2">Concluido: <strong>{stats.agendaHojeResumo.concluido}</strong></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Proximos Compromissos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.agendaProximos.length === 0 ? <p className="text-sm text-muted-foreground">Sem proximos compromissos.</p> : stats.agendaProximos.map((item) => (
              <div key={item.id} className="rounded-md border p-2">
                <p className="text-sm font-medium">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.data_hora).toLocaleString("pt-BR")} - {item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estoque Baixo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.estoqueBaixo.length === 0 ? <p className="text-sm text-muted-foreground">Sem itens em alerta.</p> : stats.estoqueBaixo.map((item) => (
              <div key={item.id} className="rounded-md border p-2">
                <p className="text-sm font-medium">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{Number(item.quantidade_atual).toFixed(3)} / minimo {Number(item.quantidade_minima).toFixed(3)} {item.unidade}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ultimos Atendimentos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.atendimentosRecentes.length === 0 ? <p className="text-sm text-muted-foreground">Sem atendimentos recentes.</p> : stats.atendimentosRecentes.map((item) => (
              <div key={item.id} className="rounded-md border p-2">
                <p className="text-sm font-medium">#{item.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.updated_at).toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.diagnostico ?? "Sem diagnostico"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {canSeeMoney ? (
        <Card>
          <CardHeader><CardTitle>Ultimos Lancamentos Financeiros</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.financeiroRecentes.length === 0 ? <p className="text-sm text-muted-foreground">Sem lancamentos.</p> : stats.financeiroRecentes.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <p className="text-sm font-medium">{item.tipo} - {item.categoria}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.data_competencia).toLocaleDateString("pt-BR")} - {item.status}</p>
                </div>
                <p className={`text-sm font-semibold ${item.tipo === "RECEITA" ? "text-green-600" : "text-red-500"}`}>{moeda(Number(item.valor))}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
