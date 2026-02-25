export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE ?? 'email.exchange',
  rabbitmqQueue: process.env.RABBITMQ_QUEUE ?? 'email.send.queue',
  rabbitmqRoutingKey: process.env.RABBITMQ_ROUTING_KEY ?? 'email.send',
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  minioPort: Number(process.env.MINIO_PORT ?? 9000),
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET ?? 'email-attachments',
  minioUseSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
  smtpHost: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpSecure: (process.env.SMTP_SECURE ?? 'true') === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  databaseUrl: process.env.DATABASE_URL ?? ''
};
