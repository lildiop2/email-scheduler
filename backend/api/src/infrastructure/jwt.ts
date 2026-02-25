import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtClaims {
  sub: string;
  email: string;
}

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn });
}

export function signRefreshToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
}

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, env.jwtAccessSecret) as JwtClaims;
}

export function verifyRefreshToken(token: string): JwtClaims {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtClaims;
}
