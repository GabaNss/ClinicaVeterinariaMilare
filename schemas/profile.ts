import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Nome muito curto").max(120, "Nome muito longo")
});

export const themePreferenceSchema = z.object({
  theme_preference: z.enum(["light", "dark"])
});

export const profileRoleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["ADMIN", "VETERINARIO", "ESTAGIARIO"])
});

export const profileApprovalSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean()
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ThemePreferenceInput = z.infer<typeof themePreferenceSchema>;
export type ProfileRoleInput = z.infer<typeof profileRoleSchema>;
export type ProfileApprovalInput = z.infer<typeof profileApprovalSchema>;
