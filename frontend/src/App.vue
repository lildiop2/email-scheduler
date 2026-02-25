<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3 text-xl font-semibold">
          <font-awesome-icon icon="envelope" class="text-slate-700" />
          Email Scheduler
        </div>
        <nav class="flex items-center gap-4 text-sm">
          <template v-if="auth.isAuthenticated">
            <RouterLink class="text-slate-600 hover:text-slate-900" to="/">Dashboard</RouterLink>
            <RouterLink class="text-slate-600 hover:text-slate-900" to="/emails/new">Criar Email</RouterLink>
            <RouterLink class="text-slate-600 hover:text-slate-900" to="/emails">Emails</RouterLink>
            <button class="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100" @click="handleLogout">
              Sair
            </button>
          </template>
          <template v-else>
            <RouterLink class="text-slate-600 hover:text-slate-900" to="/login">Login</RouterLink>
          </template>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <div
        v-if="notice.message"
        class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="status"
      >
        {{ notice.message }}
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { logout } from './services/auth';

const router = useRouter();
const auth = useAuthStore();
const notice = reactive({
  message: ''
});

async function handleLogout() {
  try {
    await logout();
  } finally {
    auth.clear();
    router.push({ name: 'login' });
  }
}

function handleAutoLogout(event: Event) {
  const detail = (event as CustomEvent).detail ?? {};
  const reason = detail.reason ?? 'session_expired';
  if (reason === 'REFRESH_EXPIRED') {
    notice.message = 'Sua sessão expirou. Faça login novamente.';
  } else if (reason === 'UNAUTHORIZED') {
    notice.message = 'Você foi desconectado. Faça login novamente.';
  } else {
    notice.message = 'Sessão encerrada. Faça login novamente.';
  }
}

onMounted(() => {
  window.addEventListener('auth:logout', handleAutoLogout);
});

onBeforeUnmount(() => {
  window.removeEventListener('auth:logout', handleAutoLogout);
});
</script>
