import { getRabbitChannel } from './infrastructure/rabbitmq';
import { processEmail } from './email.processor';
import { env } from './config/env';

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
          channel.ack(msg);
          return;
        }

        const result = await processEmail(payload.emailId);
        if (result === 'retry') {
          channel.nack(msg, false, true);
        } else {
          channel.ack(msg);
        }
      } catch {
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
}
