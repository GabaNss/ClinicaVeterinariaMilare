import { z } from "zod";

export const attachmentSchema = z.object({
  atendimento_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  mime_type: z.string().optional().or(z.literal("")),
  size_bytes: z.coerce.number().nonnegative().optional()
});

export type AttachmentInput = z.infer<typeof attachmentSchema>;
