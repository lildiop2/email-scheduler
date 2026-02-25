<template>
  <div class="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
    <h1 class="mb-6 text-2xl font-semibold">Login</h1>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-2 block text-sm font-medium">Email</label>
        <input v-model="form.email" class="w-full rounded border border-slate-200 px-3 py-2" type="email" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Senha</label>
        <input v-model="form.password" class="w-full rounded border border-slate-200 px-3 py-2" type="password" />
      </div>
      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
      <button class="w-full rounded bg-slate-900 py-2 text-white">Entrar</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { z } from 'zod';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { login } from '../services/auth';

const router = useRouter();
const auth = useAuthStore();
const error = ref('');

const form = reactive({
  email: '',
  password: ''
});

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

async function handleSubmit() {
  error.value = '';
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    error.value = 'Preencha email e senha válidos.';
    return;
  }

  try {
    const response = await login(parsed.data.email, parsed.data.password);
    auth.setTokens(response.accessToken, response.refreshToken);
    router.push('/');
  } catch {
    error.value = 'Credenciais inválidas.';
  }
}
</script>
