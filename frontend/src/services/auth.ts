import { api } from './api';

export interface AuthResponse {
  user: { id: string; email: string };
  accessToken: string;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}
