import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import {
  createEmailHandler,
  getEmailHandler,
  listEmailsHandler,
  updateEmailHandler
} from './email.controller';

export const emailRouter = Router();

emailRouter.use(requireAuth);

emailRouter.post('/', createEmailHandler);
emailRouter.get('/', listEmailsHandler);
emailRouter.get('/:id', getEmailHandler);
emailRouter.patch('/:id', updateEmailHandler);
