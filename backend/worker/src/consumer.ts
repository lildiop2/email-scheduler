import { getRabbitChannel } from './infrastructure/rabbitmq';
import { processEmail } from './email.processor';
import { env } from './config/env';
import { logger } from './infrastructure/logger';

export async function startConsumer() {
  const channel = await getRabbitChannel();

  await channel.consume(
    env.rabbitmqQueue,
    async (msg) => {
      if (!msg) return;
      const content = msg.content.toString();

      try {
        const payload = JSON.parse(content) as { emailId?: string };
        if (!payload.emailId) {
          logger.warn('message_missing_email_id');
          channel.ack(msg);
          return;
        }

        const result = await processEmail(payload.emailId);
        if (result === 'retry') {
          logger.warn('email_processing_retry', { emailId: payload.emailId });
          channel.nack(msg, false, true);
        } else if (result === 'fail') {
          logger.error('email_processing_failed', { emailId: payload.emailId });
          channel.ack(msg);
        } else {
          logger.info('email_processed', { emailId: payload.emailId });
          channel.ack(msg);
        }
      } catch (err) {
        logger.error('message_processing_error', { err });
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
  logger.info('consumer_started', { queue: env.rabbitmqQueue });
}
