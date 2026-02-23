import { z } from "zod";

export const atendimentoSchema = z.object({
  id: z.string().uuid().optional(),
  tutor_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  veterinario_id: z.string().uuid(),
  agenda_id: z.string().uuid().nullable().optional(),
  queixa_principal: z.string().max(2000).optional().or(z.literal("")),
  anamnese: z.string().max(4000).optional().or(z.literal("")),
  diagnostico: z.string().max(4000).optional().or(z.literal("")),
  conduta: z.string().max(4000).optional().or(z.literal("")),
  prescricao: z.string().max(4000).optional().or(z.literal("")),
  retorno_em: z.string().optional().or(z.literal(""))
});

export type AtendimentoInput = z.infer<typeof atendimentoSchema>;
