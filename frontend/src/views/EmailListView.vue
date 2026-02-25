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
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="font-medium">{{ email.subject }}</div>
              <div class="text-sm text-slate-500">{{ email.status }} • {{ formatDate(email.scheduled_at) }}</div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span>{{ email.recipients.length }} destinatários</span>
              <button
                v-if="email.status === 'SCHEDULED'"
                class="rounded border border-slate-300 px-3 py-1 text-slate-700"
                @click="openEdit(email)"
              >
                Editar
              </button>
              <button
                v-if="email.status === 'SCHEDULED'"
                class="rounded bg-slate-900 px-3 py-1 text-white"
                @click="handleSendNow(email)"
              >
                Enviar agora
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="editing" class="rounded-2xl bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-semibold">Editar Email</h2>
      <form class="space-y-4" @submit.prevent="handleUpdate">
        <div>
          <label class="mb-2 block text-sm font-medium">Assunto</label>
          <input v-model="editForm.subject" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Corpo (HTML)</label>
          <textarea v-model="editForm.body_html" class="h-32 w-full rounded border border-slate-200 px-3 py-2"></textarea>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Agendar para</label>
          <input v-model="editForm.scheduled_at" class="w-full rounded border border-slate-200 px-3 py-2" type="datetime-local" />
        </div>
        <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
        <div class="flex items-center gap-3">
          <button class="rounded bg-slate-900 px-4 py-2 text-white">Salvar</button>
          <button class="rounded border border-slate-300 px-4 py-2" type="button" @click="cancelEdit">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listEmails, sendEmailNow, updateEmail } from '../services/emails';

const statuses = ['SCHEDULED', 'SENT', 'FAILED'];
const status = ref('SCHEDULED');
const emails = ref<any[]>([]);
const loading = ref(false);
const editing = ref(false);
const error = ref('');

const editForm = reactive({
  id: '',
  subject: '',
  body_html: '',
  scheduled_at: ''
});

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

function openEdit(email: any) {
  editing.value = true;
  error.value = '';
  editForm.id = email.id;
  editForm.subject = email.subject;
  editForm.body_html = email.body_html;
  editForm.scheduled_at = email.scheduled_at.slice(0, 16);
}

function cancelEdit() {
  editing.value = false;
}

async function handleUpdate() {
  error.value = '';
  try {
    await updateEmail(editForm.id, {
      subject: editForm.subject,
      body_html: editForm.body_html,
      scheduled_at: new Date(editForm.scheduled_at).toISOString()
    });
    editing.value = false;
    fetchEmails();
  } catch {
    error.value = 'Falha ao atualizar email.';
  }
}

async function handleSendNow(email: any) {
  try {
    await sendEmailNow(email.id);
    fetchEmails();
  } catch {
    error.value = 'Falha ao enviar agora.';
  }
}

onMounted(fetchEmails);
</script>
