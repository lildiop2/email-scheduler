import { Request, Response } from 'express';
import { LoginSchema, RegisterSchema } from './auth.schemas';
import { logger } from '../../infrastructure/logger';
import { loginUser, refreshTokens, registerUser, revokeRefreshToken } from './auth.service';
import { env } from '../../config/env';

function refreshCookieMaxAgeMs(): number {
  const match = /^([0-9]+)([smhd])$/.exec(env.jwtRefreshExpiresIn);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit];
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(env.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: env.refreshCookieSecure,
    sameSite: env.refreshCookieSameSite as 'lax' | 'strict' | 'none',
    path: env.refreshCookiePath,
    maxAge: refreshCookieMaxAgeMs()
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.refreshCookieSecure,
    sameSite: env.refreshCookieSameSite as 'lax' | 'strict' | 'none',
    path: env.refreshCookiePath
  });
}

export async function registerHandler(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    const result = await registerUser(parsed.data.email, parsed.data.password);
    setRefreshCookie(res, result.refreshToken);
    return res.status(201).json({
      user: { id: result.user.id, email: result.user.email },
      accessToken: result.accessToken
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
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({
      user: { id: result.user.id, email: result.user.email },
      accessToken: result.accessToken
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
  try {
    const refreshToken = req.cookies?.[env.refreshCookieName];
    if (!refreshToken) {
      return res.status(401).json({ error: 'REFRESH_EXPIRED' });
    }
    const result = await refreshTokens(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ accessToken: result.accessToken });
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

export async function logoutHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.[env.refreshCookieName];
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearRefreshCookie(res);
  return res.status(204).send();
}
