import express from 'express';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/auth', authRouter);

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
