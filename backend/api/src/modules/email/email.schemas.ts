import { z } from 'zod';

export const RecipientSchema = z.object({
  type: z.enum(['TO', 'CC', 'BCC']),
  email: z.string().email()
});

export const AttachmentSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  size: z.number().int().nonnegative(),
  storage_key: z.string().min(1)
});

export const CreateEmailSchema = z.object({
  subject: z.string().min(1),
  body_html: z.string().min(1),
  from_alias: z.string().optional(),
  scheduled_at: z.string().datetime(),
  recipients: z.array(RecipientSchema).min(1),
  attachments: z.array(AttachmentSchema).optional().default([])
});

export const UpdateEmailSchema = z.object({
  subject: z.string().min(1).optional(),
  body_html: z.string().min(1).optional(),
  from_alias: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
  recipients: z.array(RecipientSchema).optional(),
  attachments: z.array(AttachmentSchema).optional()
});

export type CreateEmailInput = z.infer<typeof CreateEmailSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
