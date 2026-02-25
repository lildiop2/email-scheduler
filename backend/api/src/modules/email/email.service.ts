import { EmailStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma';
import { CreateEmailInput, UpdateEmailInput } from './email.schemas';

export async function createEmail(userId: string, input: CreateEmailInput) {
  const scheduledAt = new Date(input.scheduled_at);
  const fromAlias =
    typeof input.from_alias === 'string' && input.from_alias.trim().length > 0
      ? input.from_alias.trim()
      : null;

  return prisma.$transaction(async (tx) => {
    const email = await tx.email.create({
      data: {
        user_id: userId,
        subject: input.subject,
        body_html: input.body_html,
        from_alias: fromAlias,
        status: EmailStatus.SCHEDULED,
        scheduled_at: scheduledAt
      }
    });

    await tx.recipient.createMany({
      data: input.recipients.map((recipient) => ({
        email_id: email.id,
        type: recipient.type,
        email: recipient.email
      }))
    });

    if (input.attachments.length > 0) {
      await tx.attachment.createMany({
        data: input.attachments.map((attachment) => ({
          email_id: email.id,
          filename: attachment.filename,
          mime_type: attachment.mime_type,
          size: attachment.size,
          storage_key: attachment.storage_key
        }))
      });
    }

    return email;
  });
}

export async function listEmails(userId: string, status?: EmailStatus) {
  return prisma.email.findMany({
    where: {
      user_id: userId,
      ...(status ? { status } : {})
    },
    orderBy: { created_at: 'desc' },
    include: {
      recipients: true,
      attachments: true
    }
  });
}

export async function getEmail(userId: string, emailId: string) {
  return prisma.email.findFirst({
    where: { id: emailId, user_id: userId },
    include: {
      recipients: true,
      attachments: true
    }
  });
}

function ensureEditable(status: EmailStatus) {
  if (status === EmailStatus.SENT) {
    throw new Error('EMAIL_SENT');
  }
  if (status === EmailStatus.PROCESSING) {
    throw new Error('EMAIL_PROCESSING');
  }
  if (status === EmailStatus.FAILED) {
    throw new Error('EMAIL_FAILED');
  }
}

export async function updateEmail(userId: string, emailId: string, input: UpdateEmailInput) {
  const existing = await prisma.email.findFirst({
    where: { id: emailId, user_id: userId }
  });

  if (!existing) {
    return null;
  }

  ensureEditable(existing.status);

  const updates: Record<string, unknown> = {};
  if (input.subject) updates.subject = input.subject;
  if (input.body_html) updates.body_html = input.body_html;
  if (typeof input.from_alias === 'string') {
    const nextAlias = input.from_alias.trim();
    updates.from_alias = nextAlias.length > 0 ? nextAlias : null;
  }
  if (input.scheduled_at) updates.scheduled_at = new Date(input.scheduled_at);

  return prisma.$transaction(async (tx) => {
    const email = await tx.email.update({
      where: { id: emailId },
      data: updates
    });

    if (input.recipients) {
      await tx.recipient.deleteMany({ where: { email_id: emailId } });
      await tx.recipient.createMany({
        data: input.recipients.map((recipient) => ({
          email_id: emailId,
          type: recipient.type,
          email: recipient.email
        }))
      });
    }

    if (input.attachments) {
      await tx.attachment.deleteMany({ where: { email_id: emailId } });
      if (input.attachments.length > 0) {
        await tx.attachment.createMany({
          data: input.attachments.map((attachment) => ({
            email_id: emailId,
            filename: attachment.filename,
            mime_type: attachment.mime_type,
            size: attachment.size,
            storage_key: attachment.storage_key
          }))
        });
      }
    }

    return email;
  });
}

export async function sendEmailNow(userId: string, emailId: string) {
  const existing = await prisma.email.findFirst({
    where: { id: emailId, user_id: userId }
  });

  if (!existing) {
    return null;
  }

  ensureEditable(existing.status);

  return prisma.email.update({
    where: { id: emailId },
    data: {
      status: EmailStatus.SCHEDULED,
      scheduled_at: new Date()
    }
  });
}
