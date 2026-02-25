import express from 'express';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { emailRouter } from './modules/email/email.routes';
import { attachmentRouter } from './modules/attachments/attachment.routes';
import { healthRouter } from './modules/health/health.routes';
import { metricsRouter } from './modules/metrics/metrics.routes';
import { startScheduler } from './scheduler/scheduler';

const app = express();

app.use(pinoHttp());
app.use(express.json());
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
  console.log(`API listening on port ${env.port}`);
});

startScheduler();
