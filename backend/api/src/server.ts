import express from 'express';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { emailRouter } from './modules/email/email.routes';
import { attachmentRouter } from './modules/attachments/attachment.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/emails', emailRouter);
app.use('/attachments', attachmentRouter);

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
