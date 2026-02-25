import { EmailStatus } from '@prisma/client';
import { prisma } from '../infrastructure/prisma';
import { getRabbitChannel } from '../infrastructure/rabbitmq';
import { env } from '../config/env';

const INTERVAL_MS = 30_000;

async function fetchAndMarkProcessing() {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM emails
      WHERE status = 'SCHEDULED'
      AND scheduled_at <= now()
      LIMIT 100
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) {
      return [] as string[];
    }

    const ids = rows.map((row) => row.id);

    await tx.email.updateMany({
      where: { id: { in: ids } },
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
      await prisma.email.update({
        where: { id: emailId },
        data: { status: EmailStatus.SCHEDULED }
      });
    }
  }
}

async function runSchedulerTick() {
  const ids = await fetchAndMarkProcessing();
  await publishEmailIds(ids);
}

export function startScheduler() {
  runSchedulerTick().catch(() => null);
  setInterval(() => {
    runSchedulerTick().catch(() => null);
  }, INTERVAL_MS);
}
