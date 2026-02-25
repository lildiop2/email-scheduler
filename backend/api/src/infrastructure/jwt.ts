import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtClaims {
  sub: string;
  email: string;
}

function parseExpiresIn(value: string): jwt.SignOptions['expiresIn'] {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value as jwt.SignOptions['expiresIn'];
}

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.jwtAccessSecret, {
    expiresIn: parseExpiresIn(env.jwtAccessExpiresIn)
  });
}

export function signRefreshToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.jwtRefreshSecret, {
    expiresIn: parseExpiresIn(env.jwtRefreshExpiresIn)
  });
}

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, env.jwtAccessSecret) as JwtClaims;
}

export function verifyRefreshToken(token: string): JwtClaims {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtClaims;
}
