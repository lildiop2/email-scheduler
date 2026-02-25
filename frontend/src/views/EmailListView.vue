<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 class="text-2xl font-semibold">Emails</h1>
      <div class="flex items-center gap-3 text-sm">
        <button
          v-for="option in statuses"
          :key="option"
          class="rounded-full px-3 py-1"
          :class="status === option ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'"
          @click="setStatus(option)"
        >
          {{ option }}
        </button>
      </div>
    </header>
    <div class="rounded-2xl bg-white p-6 shadow">
      <div v-if="loading" class="text-sm text-slate-500">Carregando...</div>
      <div v-else-if="emails.length === 0" class="text-sm text-slate-500">Nenhum email disponível.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="email in emails" :key="email.id" class="py-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ email.subject }}</div>
              <div class="text-sm text-slate-500">{{ email.status }} • {{ formatDate(email.scheduled_at) }}</div>
            </div>
            <div class="text-xs text-slate-500">{{ email.recipients.length }} destinatários</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listEmails } from '../services/emails';

const statuses = ['SCHEDULED', 'SENT', 'FAILED'];
const status = ref('SCHEDULED');
const emails = ref<any[]>([]);
const loading = ref(false);

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

async function fetchEmails() {
  loading.value = true;
  try {
    emails.value = await listEmails(status.value);
  } finally {
    loading.value = false;
  }
}

function setStatus(next: string) {
  status.value = next;
  fetchEmails();
}

onMounted(fetchEmails);
</script>
