import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../infrastructure/jwt';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
 
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, email: claims.email };
    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'ACCESS_EXPIRED' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}
