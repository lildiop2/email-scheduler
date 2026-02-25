import amqplib, { Channel, ChannelModel } from 'amqplib';
import { env } from '../config/env';
import { logger } from './logger';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function getRabbitChannel(): Promise<Channel> {
  if (channel) return channel;

  try {
    const createdConnection = await amqplib.connect(env.rabbitmqUrl);
    const createdChannel = await createdConnection.createChannel();

    await createdChannel.assertExchange(env.rabbitmqExchange, 'direct', { durable: true });
    await createdChannel.assertQueue(env.rabbitmqQueue, { durable: true });
    await createdChannel.bindQueue(env.rabbitmqQueue, env.rabbitmqExchange, env.rabbitmqRoutingKey);

    connection = createdConnection;
    channel = createdChannel;
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

  return channel!;
}

export async function closeRabbit() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}
