import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: (localStorage.getItem('accessToken') ?? '') as string
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken)
  },
  actions: {
    setTokens(accessToken: string) {
      this.accessToken = accessToken;
      localStorage.setItem('accessToken', accessToken);
    },
    clear() {
      this.accessToken = '';
      localStorage.removeItem('accessToken');
    }
  }
});
