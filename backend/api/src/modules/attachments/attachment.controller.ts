import { Response } from 'express';
import crypto from 'crypto';
import { PresignUploadSchema } from './attachment.schemas';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { env } from '../../config/env';
import { minioClient } from '../../infrastructure/minio';

function buildStorageKey(filename: string) {
  const id = crypto.randomUUID();
  const safeName = filename.replace(/\s+/g, '_');
  return `${id}-${safeName}`;
}

export async function presignUploadHandler(req: AuthenticatedRequest, res: Response) {
  const parsed = PresignUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (parsed.data.size > env.attachmentMaxSize) {
    return res.status(413).json({ error: 'ATTACHMENT_TOO_LARGE' });
  }

  const storageKey = buildStorageKey(parsed.data.filename);

  try {
    const url = await minioClient.presignedPutObject(env.minioBucket, storageKey, 600);
    return res.status(200).json({
      url,
      storage_key: storageKey,
      bucket: env.minioBucket,
      expires_in: 600
    });
  } catch (err) {
    return res.status(500).json({ error: 'PRESIGN_FAILED' });
  }
}
