import { z } from 'zod';

export const PresignUploadSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  size: z.number().int().positive()
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
