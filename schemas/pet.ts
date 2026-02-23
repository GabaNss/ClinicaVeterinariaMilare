import { z } from "zod";

export const petSchema = z.object({
  id: z.string().uuid().optional(),
  tutor_id: z.string().uuid("Tutor obrigatorio"),
  nome: z.string().min(2, "Nome obrigatorio"),
  especie: z.string().min(2, "Especie obrigatoria"),
  raca: z.string().max(120).optional().or(z.literal("")),
  sexo: z.string().max(20).optional().or(z.literal("")),
  cor: z.string().max(80).optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  peso_kg: z.coerce.number().nonnegative().optional(),
  microchip: z.string().max(80).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal(""))
});

export type PetInput = z.infer<typeof petSchema>;
