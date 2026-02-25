import { Router } from 'express';
import { prisma } from '../../infrastructure/prisma';
import { getRabbitChannel } from '../../infrastructure/rabbitmq';
import { minioClient } from '../../infrastructure/minio';
import { env } from '../../config/env';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'fail' });
  }
});

healthRouter.get('/rabbitmq', async (_req, res) => {
  try {
    await getRabbitChannel();
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'fail' });
  }
});

healthRouter.get('/minio', async (_req, res) => {
  try {
    await minioClient.bucketExists(env.minioBucket);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'fail' });
  }
});
