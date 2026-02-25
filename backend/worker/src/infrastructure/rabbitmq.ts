import amqplib, { Channel, Connection } from 'amqplib';
import { env } from '../config/env';
import { logger } from './logger';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getRabbitChannel(): Promise<Channel> {
  if (channel) return channel;

  try {
    connection = await amqplib.connect(env.rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertExchange(env.rabbitmqExchange, 'direct', { durable: true });
    await channel.assertQueue(env.rabbitmqQueue, { durable: true });
    await channel.bindQueue(env.rabbitmqQueue, env.rabbitmqExchange, env.rabbitmqRoutingKey);
    await channel.prefetch(10);
    logger.info('rabbitmq_connected', {
      url: env.rabbitmqUrl,
      exchange: env.rabbitmqExchange,
      queue: env.rabbitmqQueue,
      routingKey: env.rabbitmqRoutingKey
    });
  } catch (err) {
    logger.error('rabbitmq_connection_failed', { err, url: env.rabbitmqUrl });
    throw err;
  }

  return channel;
}

export async function closeRabbit() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}
