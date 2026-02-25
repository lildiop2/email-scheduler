import { Router } from 'express';
import { EmailStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma';

export const metricsRouter = Router();

metricsRouter.get('/emails', async (_req, res) => {
  const sent = await prisma.email.count({ where: { status: EmailStatus.SENT } });
  res.status(200).json({ sent });
});
