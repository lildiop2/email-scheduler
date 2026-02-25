export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change_me',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  minioPort: Number(process.env.MINIO_PORT ?? 9000),
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET ?? 'email-attachments',
  minioUseSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
  attachmentMaxSize: Number(process.env.ATTACHMENT_MAX_SIZE ?? 10 * 1024 * 1024),
  rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE ?? 'email.exchange',
  rabbitmqQueue: process.env.RABBITMQ_QUEUE ?? 'email.send.queue',
  rabbitmqRoutingKey: process.env.RABBITMQ_ROUTING_KEY ?? 'email.send'
};
