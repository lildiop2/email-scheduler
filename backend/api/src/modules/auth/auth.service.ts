import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../infrastructure/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../infrastructure/jwt';
import { env } from '../../config/env';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseRefreshExpiry(): Date {
  // Accepts values like '7d', '24h', '60m'. Defaults to 7 days if parsing fails.
  const raw = env.jwtRefreshExpiresIn;
  const match = /^([0-9]+)([smhd])$/.exec(raw);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return new Date(Date.now() + value * multipliers[unit]);
}

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash
    }
  });

  const claims = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = parseRefreshExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash: refreshTokenHash, refresh_token_expires_at: refreshTokenExpiresAt }
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const claims = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = parseRefreshExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash: refreshTokenHash, refresh_token_expires_at: refreshTokenExpiresAt }
  });

  return { user, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string) {
  const claims = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user) {
    throw new Error('INVALID_REFRESH');
  }

  if (!user.refresh_token_hash || !user.refresh_token_expires_at) {
    throw new Error('INVALID_REFRESH');
  }

  if (user.refresh_token_expires_at.getTime() < Date.now()) {
    throw new Error('REFRESH_EXPIRED');
  }

  const tokenHash = hashToken(refreshToken);
  if (tokenHash !== user.refresh_token_hash) {
    throw new Error('INVALID_REFRESH');
  }

  const newClaims = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(newClaims);
  const newRefreshToken = signRefreshToken(newClaims);
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const newRefreshTokenExpiresAt = parseRefreshExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash: newRefreshTokenHash, refresh_token_expires_at: newRefreshTokenExpiresAt }
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(refreshToken: string) {
  try {
    const claims = verifyRefreshToken(refreshToken);
    await prisma.user.update({
      where: { id: claims.sub },
      data: { refresh_token_hash: null, refresh_token_expires_at: null }
    });
  } catch {
    // ignore invalid tokens
  }
}
