import { Client } from 'minio';
import { env } from '../config/env';

export const minioClient = new Client({
  endPoint: env.minioEndpoint,
  port: env.minioPort,
  useSSL: env.minioUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey
});
