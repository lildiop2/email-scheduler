import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { emailRouter } from './modules/email/email.routes';
import { attachmentRouter } from './modules/attachments/attachment.routes';
import { healthRouter } from './modules/health/health.routes';
import { metricsRouter } from './modules/metrics/metrics.routes';
import { startScheduler } from './scheduler/scheduler';
import { httpLogger, logger } from './infrastructure/logger';

const app = express();

const corsOriginsRaw = process.env.CORS_ORIGIN;
const corsOrigins = corsOriginsRaw ? corsOriginsRaw.split(',').map((value) => value.trim()) : null;

app.use(
  cors({
    origin: corsOrigins ?? true,
    credentials: Boolean(corsOrigins)
  })
);
app.use(httpLogger());
app.use(express.json());
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120
  })
);

app.use('/auth', authRouter);
app.use('/emails', emailRouter);
app.use('/attachments', attachmentRouter);
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);

app.listen(env.port, () => {
  logger.info('api_started', { port: env.port });
});

startScheduler();
