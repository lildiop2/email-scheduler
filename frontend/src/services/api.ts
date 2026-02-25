import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearTokens() {
  localStorage.removeItem('accessToken');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error;
    if (status === 401 && code === 'ACCESS_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'refresh_failed' } }));
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (status === 401 && (code === 'REFRESH_EXPIRED' || code === 'UNAUTHORIZED')) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: code } }));
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
