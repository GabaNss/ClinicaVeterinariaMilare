import { cache } from "react";
import { requireUser } from "@/lib/auth/requireUser";

type LucroPeriodo = {
  ganhos: number;
  gastos: number;
  lucro: number;
};

type FinanceiroResumo = {
  receitaPendente: number;
  despesaPendente: number;
};

type AgendaHojeResumo = {
  total: number;
  agendado: number;
  confirmado: number;
  emAtendimento: number;
  concluido: number;
  cancelado: number;
};

type AgendaProximaItem = {
  id: string;
  titulo: string;
  data_hora: string;
  status: string;
};

type FinanceiroRecenteItem = {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  status: string;
  data_competencia: string;
};

type EstoqueBaixoItem = {
  id: string;
  nome: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade: string;
};

type AtendimentoRecenteItem = {
  id: string;
  updated_at: string;
  diagnostico: string | null;
};

export type DashboardStats = {
  totais: {
    tutores: number;
    pets: number;
    atendimentos: number;
    agendaHoje: number;
  };
  lucro: {
    diario: LucroPeriodo;
    semanal: LucroPeriodo;
    mensal: LucroPeriodo;
  };
  financeiro: FinanceiroResumo;
  agendaHojeResumo: AgendaHojeResumo;
  agendaProximos: AgendaProximaItem[];
  financeiroRecentes: FinanceiroRecenteItem[];
  estoqueBaixo: EstoqueBaixoItem[];
  atendimentosRecentes: AtendimentoRecenteItem[];
};

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function sumLucro(rows: Array<{ tipo: string; valor: number; data_competencia: string }>, start: string, end: string): LucroPeriodo {
  let ganhos = 0;
  let gastos = 0;

  for (const row of rows) {
    if (row.data_competencia < start || row.data_competencia > end) continue;
    const valor = Number(row.valor ?? 0);
    if (row.tipo === "RECEITA") ganhos += valor;
    if (row.tipo === "DESPESA") gastos += valor;
  }

  return { ganhos, gastos, lucro: ganhos - gastos };
}

export const getDashboardStats = cache(async () => {
  const { supabase, profile } = await requireUser();
  const canSeeMoney = profile.role !== "ESTAGIARIO";
  const now = new Date();
  const today = toDateOnly(now);
  const weeklyStartDate = new Date(now);
  weeklyStartDate.setDate(now.getDate() - 6);
  const weekStart = toDateOnly(weeklyStartDate);
  const monthStart = `${today.slice(0, 8)}01`;

  const [tutores, pets, atendimentos, agendaHojeCount, agendaHojeList, financeiroPendenteRows, financeiroPagoRows, agendaProximosRows, financeiroRecentesRows, estoqueRows, atendimentosRecentesRows] = await Promise.all([
    supabase.from("tutores").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("pets").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("atendimentos").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("agenda").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("data_hora", `${today}T00:00:00`).lte("data_hora", `${today}T23:59:59`),
    supabase.from("agenda").select("id, status").is("deleted_at", null).gte("data_hora", `${today}T00:00:00`).lte("data_hora", `${today}T23:59:59`),
    canSeeMoney
      ? supabase.from("financeiro").select("tipo, valor").is("deleted_at", null).eq("status", "PENDENTE")
      : Promise.resolve({ data: [] as Array<{ tipo: string; valor: number }>, error: null }),
    canSeeMoney
      ? supabase.from("financeiro").select("tipo, valor, data_competencia").is("deleted_at", null).eq("status", "PAGO").gte("data_competencia", monthStart).lte("data_competencia", today)
      : Promise.resolve({ data: [] as Array<{ tipo: string; valor: number; data_competencia: string }>, error: null }),
    supabase.from("agenda").select("id, titulo, data_hora, status").is("deleted_at", null).gte("data_hora", now.toISOString()).order("data_hora", { ascending: true }).limit(8),
    canSeeMoney
      ? supabase.from("financeiro").select("id, tipo, categoria, valor, status, data_competencia").is("deleted_at", null).order("created_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] as FinanceiroRecenteItem[], error: null }),
    supabase.from("estoque_itens").select("id, nome, quantidade_atual, quantidade_minima, unidade").is("deleted_at", null).order("quantidade_atual", { ascending: true }).limit(20),
    supabase.from("atendimentos").select("id, updated_at, diagnostico").is("deleted_at", null).order("updated_at", { ascending: false }).limit(8)
  ]);

  const financeiroPendente = (financeiroPendenteRows.data ?? []) as Array<{ tipo: string; valor: number }>;
  const receitaPendente = financeiroPendente.filter((x) => x.tipo === "RECEITA").reduce((acc, x) => acc + Number(x.valor ?? 0), 0);
  const despesaPendente = financeiroPendente.filter((x) => x.tipo === "DESPESA").reduce((acc, x) => acc + Number(x.valor ?? 0), 0);

  const pagos = (financeiroPagoRows.data ?? []) as Array<{ tipo: string; valor: number; data_competencia: string }>;
  const lucroDiario = sumLucro(pagos, today, today);
  const lucroSemanal = sumLucro(pagos, weekStart, today);
  const lucroMensal = sumLucro(pagos, monthStart, today);

  const agendaHoje = (agendaHojeList.data ?? []) as Array<{ id: string; status: string }>;
  const agendaResumo: AgendaHojeResumo = {
    total: agendaHoje.length,
    agendado: agendaHoje.filter((x) => x.status === "AGENDADO").length,
    confirmado: agendaHoje.filter((x) => x.status === "CONFIRMADO").length,
    emAtendimento: agendaHoje.filter((x) => x.status === "EM_ATENDIMENTO").length,
    concluido: agendaHoje.filter((x) => x.status === "CONCLUIDO").length,
    cancelado: agendaHoje.filter((x) => x.status === "CANCELADO").length
  };

  const estoqueBaixo = ((estoqueRows.data ?? []) as EstoqueBaixoItem[]).filter((item) => Number(item.quantidade_atual) <= Number(item.quantidade_minima)).slice(0, 8);

  return {
    totais: {
      tutores: tutores.count ?? 0,
      pets: pets.count ?? 0,
      atendimentos: atendimentos.count ?? 0,
      agendaHoje: agendaHojeCount.count ?? 0
    },
    lucro: {
      diario: lucroDiario,
      semanal: lucroSemanal,
      mensal: lucroMensal
    },
    financeiro: {
      receitaPendente,
      despesaPendente
    },
    agendaHojeResumo: agendaResumo,
    agendaProximos: ((agendaProximosRows.data ?? []) as AgendaProximaItem[]).slice(0, 8),
    financeiroRecentes: ((financeiroRecentesRows.data ?? []) as FinanceiroRecenteItem[]).slice(0, 8),
    estoqueBaixo,
    atendimentosRecentes: ((atendimentosRecentesRows.data ?? []) as AtendimentoRecenteItem[]).slice(0, 8)
  } satisfies DashboardStats;
});
