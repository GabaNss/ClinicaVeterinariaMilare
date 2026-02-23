import { z } from "zod";

export const agendaSchema = z.object({
  id: z.string().uuid().optional(),
  tutor_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  veterinario_id: z.string().uuid().nullable().optional(),
  titulo: z.string().min(2),
  descricao: z.string().max(1200).optional().or(z.literal("")),
  data_hora: z.string().min(10),
  status: z.enum(["AGENDADO", "CONFIRMADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"])
});

export type AgendaInput = z.infer<typeof agendaSchema>;
