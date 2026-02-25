import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
