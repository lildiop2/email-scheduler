import { Request, Response } from 'express';
import { EmailStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../middlewares/auth';
import sanitizeHtml from 'sanitize-html';
import { CreateEmailSchema, UpdateEmailSchema } from './email.schemas';
import { createEmail, getEmail, listEmails, updateEmail } from './email.service';

export async function createEmailHandler(req: AuthenticatedRequest, res: Response) {
  const parsed = CreateEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const email = await createEmail(req.user.id, {
    ...parsed.data,
    body_html: sanitizeHtml(parsed.data.body_html)
  });
  return res.status(201).json(email);
}

export async function listEmailsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const statusRaw = req.query.status as string | undefined;
  const status = statusRaw ? (statusRaw as EmailStatus) : undefined;
  const emails = await listEmails(req.user.id, status);
  return res.status(200).json(emails);
}

export async function getEmailHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const email = await getEmail(req.user.id, req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  return res.status(200).json(email);
}

export async function updateEmailHandler(req: AuthenticatedRequest, res: Response) {
  const parsed = UpdateEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    const payload = parsed.data.body_html
      ? { ...parsed.data, body_html: sanitizeHtml(parsed.data.body_html) }
      : parsed.data;
    const email = await updateEmail(req.user.id, req.params.id, payload);
    if (!email) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    return res.status(200).json(email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message === 'EMAIL_SENT') {
      return res.status(409).json({ error: message });
    }

    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}
