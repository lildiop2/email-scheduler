import { EmailStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import { prisma } from './infrastructure/prisma';
import { env } from './config/env';
import { minioClient } from './infrastructure/minio';
import { logger } from './infrastructure/logger';

export type ProcessResult = 'ack' | 'retry' | 'fail';

async function loadAttachment(attachment: {
  filename: string;
  mime_type: string;
  storage_key: string;
}) {
  const stream = await minioClient.getObject(env.minioBucket, attachment.storage_key);
  return {
    filename: attachment.filename,
    content: stream,
    contentType: attachment.mime_type
  };
}

export async function processEmail(emailId: string): Promise<ProcessResult> {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { recipients: true, attachments: true }
  });

  if (!email) {
    return 'ack';
  }

  if (email.status !== EmailStatus.PROCESSING) {
    return 'ack';
  }

  const to = email.recipients.filter((r) => r.type === 'TO').map((r) => r.email);
  const cc = email.recipients.filter((r) => r.type === 'CC').map((r) => r.email);
  const bcc = email.recipients.filter((r) => r.type === 'BCC').map((r) => r.email);

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }, logger:logger
  });

  try {
    const attachments = await Promise.all(email.attachments.map((a) => loadAttachment(a)));

    const from =
      email.from_alias && email.from_alias.trim().length > 0
        ? `"${email.from_alias.trim().replaceAll('"', '\\"')}" <${email.from_alias.trim()}>`
        : env.smtpUser;

    logger.info('email_sending', {
      emailId: email.id,
      from,
      fromAlias: email.from_alias ?? null
    });

    await transporter.sendMail({
      from,
      to,
      cc,
      bcc,
      subject: email.subject,
      html: email.body_html,
      attachments,
      envelope:{
        from: env.smtpUser,
        to: [...to, ...cc, ...bcc]
      }
    });
    
    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: EmailStatus.SENT,
        sent_at: new Date(),
        error_message: null
      }
    });
    logger.info('email_sent', {
      emailId: email.id,
      toCount: to.length,
      ccCount: cc.length,
      bccCount: bcc.length,
      attachmentCount: email.attachments.length
    });

    return 'ack';
  } catch (err) {
    const nextRetry = email.retry_count + 1;
    const reachedLimit = nextRetry >= 5;

    await prisma.email.update({
      where: { id: email.id },
      data: {
        retry_count: nextRetry,
        status: reachedLimit ? EmailStatus.FAILED : EmailStatus.PROCESSING,
        error_message: err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      }
    });

    logger.error('email_send_failed', {
      emailId: email.id,
      retryCount: nextRetry,
      reachedLimit,
      err
    });

    return reachedLimit ? 'fail' : 'retry';
  }
}
