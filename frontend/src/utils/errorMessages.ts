import axios from 'axios';

export type ErrorRule = {
  status?: number;
  code?: string;
  message: string;
};

export function resolveApiErrorMessage(
  err: unknown,
  rules: ErrorRule[],
  fallback: string
) {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }
  const status = err.response?.status;
  const code = err.response?.data?.error;
  for (const rule of rules) {
    if (rule.status !== undefined && status !== rule.status) continue;
    if (rule.code !== undefined && code !== rule.code) continue;
    return rule.message;
  }
  return fallback;
}
