import { z } from "zod";

export const vacinaSchema = z.object({
  id: z.string().uuid().optional(),
  pet_id: z.string().uuid(),
  atendimento_id: z.string().uuid().nullable().optional(),
  nome: z.string().min(2),
  lote: z.string().max(120).optional().or(z.literal("")),
  fabricante: z.string().max(120).optional().or(z.literal("")),
  data_aplicacao: z.string().min(8),
  proxima_dose: z.string().optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal(""))
});

export type VacinaInput = z.infer<typeof vacinaSchema>;
