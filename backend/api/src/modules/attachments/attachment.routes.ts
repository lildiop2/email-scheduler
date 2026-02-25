import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { presignUploadHandler } from './attachment.controller';

export const attachmentRouter = Router();

attachmentRouter.use(requireAuth);
attachmentRouter.post('/presign', presignUploadHandler);
