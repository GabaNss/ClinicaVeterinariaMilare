import { z } from "zod";

export const agendaSchema = z.object({
  id: z.string().uuid().optional(),
  tutor_id: z.string().uuid().nullable().optional(),
  pet_id: z.string().uuid().nullable().optional(),
  veterinario_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(["PESSOAL", "GERAL"]).default("PESSOAL"),
  tipo_evento: z.enum(["CONSULTA", "COMPROMISSO"]).default("CONSULTA"),
  titulo: z.string().min(2),
  descricao: z.string().max(1200).optional().or(z.literal("")),
  data_hora: z.string().min(10),
  status: z.enum(["AGENDADO", "CONFIRMADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"])
}).superRefine((value, ctx) => {
  if (value.tipo_evento === "CONSULTA") {
    if (!value.tutor_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tutor e obrigatorio para consulta", path: ["tutor_id"] });
    }
    if (!value.pet_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pet e obrigatorio para consulta", path: ["pet_id"] });
    }
  }
});

export type AgendaInput = z.infer<typeof agendaSchema>;
