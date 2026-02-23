import { z } from "zod";

export const financeiroSchema = z.object({
  id: z.string().uuid().optional(),
  atendimento_id: z.string().uuid().nullable().optional(),
  tutor_id: z.string().uuid(),
  pet_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().min(2).max(120),
  descricao: z.string().max(2000).optional().or(z.literal("")),
  valor: z.coerce.number().nonnegative("Valor invalido"),
  data_competencia: z.string().min(8),
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO"]),
  data_pagamento: z.string().optional().or(z.literal(""))
});

export type FinanceiroInput = z.infer<typeof financeiroSchema>;
