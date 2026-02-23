import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres")
});

export const signUpSchema = authSchema.extend({
  full_name: z.string().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  phone: z.string().optional()
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Email invalido")
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  confirm_password: z.string().min(6, "Confirmacao deve ter no minimo 6 caracteres")
}).refine((value) => value.password === value.confirm_password, {
  message: "As senhas nao conferem",
  path: ["confirm_password"]
});

export type AuthInput = z.infer<typeof authSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
