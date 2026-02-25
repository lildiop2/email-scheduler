import { EmailStatus } from '@prisma/client';
import { prisma } from '../infrastructure/prisma';
import { getRabbitChannel } from '../infrastructure/rabbitmq';
import { env } from '../config/env';
import { logger } from '../infrastructure/logger';

const INTERVAL_MS = 30_000;

async function fetchAndMarkProcessing() {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.email.findMany({
      where: {
        status: EmailStatus.SCHEDULED,
        scheduled_at: { lte: new Date() }
      },
      select: { id: true },
      orderBy: { scheduled_at: 'asc' },
      take: 100
    });

    if (rows.length === 0) {
      return [] as string[];
    }

    const ids = rows.map((row) => row.id);

    await tx.email.updateMany({
      where: {
        id: { in: ids },
        status: EmailStatus.SCHEDULED
      },
      data: { status: EmailStatus.PROCESSING }
    });

    return ids;
  });
}

async function publishEmailIds(emailIds: string[]) {
  if (emailIds.length === 0) return;

  const channel = await getRabbitChannel();

  for (const emailId of emailIds) {
    const payload = Buffer.from(JSON.stringify({ emailId }));
    const ok = channel.publish(env.rabbitmqExchange, env.rabbitmqRoutingKey, payload, {
      persistent: true
    });

    if (!ok) {
      logger.warn('rabbitmq_publish_backpressure', { emailId });
      await prisma.email.update({
        where: { id: emailId },
        data: { status: EmailStatus.SCHEDULED }
      });
    }
  }
}

async function runSchedulerTick() {
  const startedAt = Date.now();
  const ids = await fetchAndMarkProcessing();
  if (ids.length > 0) {
    logger.info('scheduler_batch', { count: ids.length });
  }
  await publishEmailIds(ids);
  if (ids.length > 0) {
    let queueStats: { messageCount: number; consumerCount: number } | null = null;
    try {
      const channel = await getRabbitChannel();
      const info = await channel.checkQueue(env.rabbitmqQueue);
      queueStats = { messageCount: info.messageCount, consumerCount: info.consumerCount };
    } catch (err) {
      logger.warn('queue_stats_failed', { err });
    }
    logger.info('scheduler_batch_done', {
      count: ids.length,
      durationMs: Date.now() - startedAt,
      queue: queueStats
    });
  }
}

export function startScheduler() {
  logger.info('scheduler_started', { intervalMs: INTERVAL_MS });
  runSchedulerTick().catch((err) => {
    logger.error('scheduler_tick_failed', { err });
  });
  setInterval(() => {
    runSchedulerTick().catch((err) => {
      logger.error('scheduler_tick_failed', { err });
    });
  }, INTERVAL_MS);
}
