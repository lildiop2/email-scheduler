import { Request, Response } from 'express';
import { LoginSchema, RefreshSchema, RegisterSchema } from './auth.schemas';
import { logger } from '../../infrastructure/logger';
import { loginUser, refreshTokens, registerUser } from './auth.service';

export async function registerHandler(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    const result = await registerUser(parsed.data.email, parsed.data.password);
    return res.status(201).json({
      user: { id: result.user.id, email: result.user.email },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message !== 'EMAIL_IN_USE') {
      logger.error('auth_register_failed', { error: message });
    }
    if (message === 'EMAIL_IN_USE') {
      return res.status(409).json({ error: message });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return res.status(200).json({
      user: { id: result.user.id, email: result.user.email },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message !== 'INVALID_CREDENTIALS') {
      logger.error('auth_login_failed', { error: message });
    }
    if (message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: message });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    const result = await refreshTokens(parsed.data.refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    if ((err as any)?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'REFRESH_EXPIRED' });
    }
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message !== 'INVALID_REFRESH' && message !== 'REFRESH_EXPIRED') {
      logger.error('auth_refresh_failed', { error: message });
    }
    if (message === 'INVALID_REFRESH' || message === 'REFRESH_EXPIRED') {
      return res.status(401).json({ error: message });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}
