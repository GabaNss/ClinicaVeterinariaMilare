export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "ADMIN" | "VETERINARIO" | "ESTAGIARIO";

export type Profile = {
  id: string;
  workspace_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  theme_preference: "light" | "dark";
  created_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  created_at: string;
};

export type AuditFields = {
  created_at: string;
  created_by: string;
  created_by_name: string;
  updated_at: string;
  updated_by: string;
  updated_by_name: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_name: string | null;
};

export type Tutor = AuditFields & {
  id: string;
  workspace_id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
};

export type Pet = AuditFields & {
  id: string;
  workspace_id: string;
  tutor_id: string;
  nome: string;
  especie: string;
  raca: string | null;
  sexo: string | null;
  cor: string | null;
  data_nascimento: string | null;
  peso_kg: number | null;
  microchip: string | null;
  observacoes: string | null;
};

export type AgendaStatus = "AGENDADO" | "CONFIRMADO" | "EM_ATENDIMENTO" | "CONCLUIDO" | "CANCELADO";
export type AgendaTipo = "PESSOAL" | "GERAL";
export type AgendaTipoEvento = "CONSULTA" | "COMPROMISSO";

export type AgendaItem = AuditFields & {
  id: string;
  workspace_id: string;
  tutor_id: string | null;
  pet_id: string | null;
  veterinario_id: string | null;
  tipo: AgendaTipo;
  tipo_evento: AgendaTipoEvento;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  status: AgendaStatus;
};

export type Atendimento = AuditFields & {
  id: string;
  workspace_id: string;
  tutor_id: string;
  pet_id: string;
  veterinario_id: string;
  agenda_id: string | null;
  queixa_principal: string | null;
  anamnese: string | null;
  diagnostico: string | null;
  conduta: string | null;
  prescricao: string | null;
  retorno_em: string | null;
};

export type Vacina = AuditFields & {
  id: string;
  workspace_id: string;
  pet_id: string;
  atendimento_id: string | null;
  nome: string;
  lote: string | null;
  fabricante: string | null;
  data_aplicacao: string;
  proxima_dose: string | null;
  observacoes: string | null;
};

export type FinanceiroTipo = "RECEITA" | "DESPESA";
export type FinanceiroStatus = "PENDENTE" | "PAGO" | "CANCELADO";

export type Financeiro = AuditFields & {
  id: string;
  workspace_id: string;
  atendimento_id: string | null;
  tutor_id: string;
  pet_id: string | null;
  tipo: FinanceiroTipo;
  categoria: string;
  descricao: string | null;
  valor: number;
  data_competencia: string;
  status: FinanceiroStatus;
  data_pagamento: string | null;
};

export type AtendimentoAttachment = AuditFields & {
  id: string;
  workspace_id: string;
  atendimento_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
};

export type EstoqueItem = AuditFields & {
  id: string;
  workspace_id: string;
  nome: string;
  categoria: string | null;
  sku: string | null;
  unidade: string;
  quantidade_atual: number;
  quantidade_minima: number;
  custo_medio: number | null;
  valor_venda: number | null;
  validade: string | null;
  lote: string | null;
  fornecedor: string | null;
  observacoes: string | null;
};

export type AuditLog = {
  id: string;
  workspace_id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "SOFT_DELETE";
  before_data: Json | null;
  after_data: Json | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
};

export type WorkspaceBackup = {
  id: string;
  workspace_id: string;
  file_name: string;
  checksum_sha256: string;
  created_at: string;
  created_by: string;
};
