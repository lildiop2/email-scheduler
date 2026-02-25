import amqplib, { Channel, Connection } from 'amqplib';
import { env } from '../config/env';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getRabbitChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqplib.connect(env.rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertExchange(env.rabbitmqExchange, 'direct', { durable: true });
  await channel.assertQueue(env.rabbitmqQueue, { durable: true });
  await channel.bindQueue(env.rabbitmqQueue, env.rabbitmqExchange, env.rabbitmqRoutingKey);

  return channel;
}

export async function closeRabbit() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}
