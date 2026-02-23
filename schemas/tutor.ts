import { z } from "zod";

export const tutorSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2, "Nome obrigatorio"),
  cpf_cnpj: z.string().max(30).optional().or(z.literal("")),
  telefone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  endereco: z.string().max(300).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal(""))
});

export type TutorInput = z.infer<typeof tutorSchema>;
