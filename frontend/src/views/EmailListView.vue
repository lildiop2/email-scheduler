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
          <label class="mb-2 block text-sm font-medium">Nome do remetente (opcional)</label>
          <input v-model="editForm.from_name" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Alias do remetente (opcional)</label>
          <input v-model="editForm.from_alias" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Corpo</label>
          <RichTextEditor v-model="editForm.body_html" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Destinatários TO (separe por vírgula)</label>
          <input v-model="editForm.to" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Destinatários CC</label>
          <input v-model="editForm.cc" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Destinatários BCC</label>
          <input v-model="editForm.bcc" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium">Anexos (substitui os atuais)</label>
          <input ref="editFileInputRef" class="w-full rounded border border-slate-200 px-3 py-2" type="file" multiple @change="handleEditFiles" />
          <div v-if="editFiles.length > 0" class="mt-2 text-xs text-slate-500">
            {{ editFiles.length }} arquivo(s) selecionado(s) • Total: {{ formatFileSize(totalEditFileSize) }}
            <button class="ml-2 text-slate-700 underline" type="button" @click="clearEditFiles">Limpar</button>
          </div>
          <ul v-if="editFiles.length > 0" class="mt-2 space-y-1 text-xs text-slate-600">
            <li
              v-for="(file, index) in editFiles"
              :key="file.name + file.size + index"
              class="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1"
              draggable="true"
              @dragstart="handleEditDragStart(index)"
              @dragover.prevent
              @drop="handleEditDrop(index)"
            >
              <span class="flex items-center gap-2">
                <span class="cursor-move text-slate-400">⋮⋮</span>
                <span>{{ file.name }} <span class="text-slate-400">({{ formatFileSize(file.size) }})</span></span>
              </span>
              <div class="flex items-center gap-2">
                <button class="text-slate-500 hover:text-slate-900" type="button" @click="moveEditFile(index, -1)">↑</button>
                <button class="text-slate-500 hover:text-slate-900" type="button" @click="moveEditFile(index, 1)">↓</button>
                <button class="text-slate-500 hover:text-slate-900" type="button" @click="removeEditFile(index)">Remover</button>
              </div>
            </li>
          </ul>
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
import { computed, onMounted, reactive, ref } from 'vue';
import RichTextEditor from '../components/RichTextEditor.vue';
import { listEmails, presignAttachment, sendEmailNow, updateEmail } from '../services/emails';

const statuses = ['SCHEDULED', 'SENT', 'FAILED'];
const status = ref('SCHEDULED');
const emails = ref<any[]>([]);
const loading = ref(false);
const editing = ref(false);
const error = ref('');
const editFiles = ref<File[]>([]);
const editFileInputRef = ref<HTMLInputElement | null>(null);
const totalEditFileSize = computed(() => editFiles.value.reduce((sum, file) => sum + file.size, 0));
const editDragIndex = ref<number | null>(null);

const editForm = reactive({
  id: '',
  subject: '',
  from_name: '',
  from_alias: '',
  body_html: '',
  to: '',
  cc: '',
  bcc: '',
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
  editForm.from_name = email.from_name ?? '';
  editForm.from_alias = email.from_alias ?? '';
  editForm.body_html = email.body_html;
  editForm.scheduled_at = email.scheduled_at.slice(0, 16);
  editForm.to = email.recipients.filter((r: any) => r.type === 'TO').map((r: any) => r.email).join(', ');
  editForm.cc = email.recipients.filter((r: any) => r.type === 'CC').map((r: any) => r.email).join(', ');
  editForm.bcc = email.recipients.filter((r: any) => r.type === 'BCC').map((r: any) => r.email).join(', ');
  editFiles.value = [];
}

function cancelEdit() {
  editing.value = false;
  clearEditFiles();
}

function splitEmails(value: string) {
  return value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function handleEditFiles(event: Event) {
  const target = event.target as HTMLInputElement;
  const next = target.files ? Array.from(target.files) : [];
  editFiles.value = [...editFiles.value, ...next];
  if (editFileInputRef.value) {
    editFileInputRef.value.value = '';
  }
}

function clearEditFiles() {
  editFiles.value = [];
  if (editFileInputRef.value) {
    editFileInputRef.value.value = '';
  }
}

function removeEditFile(index: number) {
  editFiles.value = editFiles.value.filter((_, i) => i !== index);
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function moveEditFile(index: number, direction: number) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= editFiles.value.length) return;
  const next = [...editFiles.value];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  editFiles.value = next;
}

function handleEditDragStart(index: number) {
  editDragIndex.value = index;
}

function handleEditDrop(index: number) {
  if (editDragIndex.value === null) return;
  const from = editDragIndex.value;
  const to = index;
  editDragIndex.value = null;
  if (from === to) return;
  const next = [...editFiles.value];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  editFiles.value = next;
}

async function handleUpdate() {
  error.value = '';
  try {
    if (stripHtml(editForm.body_html).length === 0) {
      error.value = 'O corpo do email está vazio.';
      return;
    }
    const recipients = [
      ...splitEmails(editForm.to).map((email) => ({ type: 'TO' as const, email })),
      ...splitEmails(editForm.cc).map((email) => ({ type: 'CC' as const, email })),
      ...splitEmails(editForm.bcc).map((email) => ({ type: 'BCC' as const, email }))
    ];
    let attachments;
    if (editFiles.value.length > 0) {
      try {
        attachments = await Promise.all(editFiles.value.map((file) => presignAttachment(file)));
      } catch (uploadErr) {
        error.value =
          uploadErr instanceof Error
            ? uploadErr.message
            : 'Falha ao enviar anexos. Verifique sua conexão e tente novamente.';
        return;
      }
    }

    await updateEmail(editForm.id, {
      subject: editForm.subject,
      body_html: editForm.body_html,
      from_name: editForm.from_name.trim(),
      from_alias: editForm.from_alias.trim(),
      scheduled_at: new Date(editForm.scheduled_at).toISOString(),
      recipients,
      ...(attachments ? { attachments } : {})
    });
    editing.value = false;
    clearEditFiles();
    fetchEmails();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Não foi possível atualizar o email. Tente novamente em instantes.';
  }
}

async function handleSendNow(email: any) {
  try {
    await sendEmailNow(email.id);
    fetchEmails();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Falha ao enviar agora.';
  }
}

onMounted(fetchEmails);
</script>
