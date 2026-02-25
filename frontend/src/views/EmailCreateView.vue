<template>
  <div class="rounded-2xl bg-white p-8 shadow">
    <h1 class="mb-6 text-2xl font-semibold">Criar Email</h1>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-2 block text-sm font-medium">Assunto</label>
        <input v-model="form.subject" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Nome do remetente (opcional)</label>
        <input v-model="form.from_name" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Alias do remetente (opcional)</label>
        <input v-model="form.from_alias" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Corpo</label>
        <RichTextEditor v-model="form.body_html" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Destinatários TO (separe por vírgula)</label>
        <input v-model="form.to" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Destinatários CC</label>
        <input v-model="form.cc" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Destinatários BCC</label>
        <input v-model="form.bcc" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Anexos</label>
        <input ref="fileInputRef" class="w-full rounded border border-slate-200 px-3 py-2" type="file" multiple @change="handleFiles" />
        <div v-if="files.length > 0" class="mt-2 text-xs text-slate-500">
          {{ files.length }} arquivo(s) selecionado(s) • Total: {{ formatFileSize(totalFileSize) }}
          <button class="ml-2 text-slate-700 underline" type="button" @click="clearFiles">Limpar</button>
        </div>
        <ul v-if="files.length > 0" class="mt-2 space-y-1 text-xs text-slate-600">
          <li
            v-for="(file, index) in files"
            :key="file.name + file.size + index"
            class="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover.prevent
            @drop="handleDrop(index)"
          >
            <span class="flex items-center gap-2">
              <span class="cursor-move text-slate-400">⋮⋮</span>
              <span>{{ file.name }} <span class="text-slate-400">({{ formatFileSize(file.size) }})</span></span>
            </span>
            <div class="flex items-center gap-2">
              <button class="text-slate-500 hover:text-slate-900" type="button" @click="moveFile(index, -1)">↑</button>
              <button class="text-slate-500 hover:text-slate-900" type="button" @click="moveFile(index, 1)">↓</button>
              <button class="text-slate-500 hover:text-slate-900" type="button" @click="removeFile(index)">Remover</button>
            </div>
          </li>
        </ul>
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Agendar para</label>
        <input v-model="form.scheduled_at" class="w-full rounded border border-slate-200 px-3 py-2" type="datetime-local" />
      </div>
      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
      <button class="rounded bg-slate-900 px-4 py-2 text-white">Agendar</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { z } from 'zod';
import RichTextEditor from '../components/RichTextEditor.vue';
import { createEmail, presignAttachment } from '../services/emails';

const error = ref('');
const files = ref<File[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const totalFileSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0));
const dragIndex = ref<number | null>(null);

const form = reactive({
  subject: '',
  body_html: '',
  from_name: '',
  from_alias: '',
  to: '',
  cc: '',
  bcc: '',
  scheduled_at: ''
});

const schema = z.object({
  subject: z.string().min(1),
  body_html: z.string().min(1),
  scheduled_at: z.string().min(1)
});

function splitEmails(value: string) {
  return value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

function handleFiles(event: Event) {
  const target = event.target as HTMLInputElement;
  const next = target.files ? Array.from(target.files) : [];
  files.value = [...files.value, ...next];
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function clearFiles() {
  files.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index);
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function moveFile(index: number, direction: number) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= files.value.length) return;
  const next = [...files.value];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  files.value = next;
}

function handleDragStart(index: number) {
  dragIndex.value = index;
}

function handleDrop(index: number) {
  if (dragIndex.value === null) return;
  const from = dragIndex.value;
  const to = index;
  dragIndex.value = null;
  if (from === to) return;
  const next = [...files.value];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  files.value = next;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

async function handleSubmit() {
  error.value = '';
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    error.value = 'Preencha assunto, corpo e data.';
    return;
  }
  if (stripHtml(form.body_html).length === 0) {
    error.value = 'O corpo do email está vazio.';
    return;
  }

  try {
    let attachments = [];
    try {
      attachments = await Promise.all(files.value.map((file) => presignAttachment(file)));
    } catch (uploadErr) {
      error.value =
        uploadErr instanceof Error
          ? uploadErr.message
          : 'Falha ao enviar anexos. Verifique sua conexão e tente novamente.';
      return;
    }
    const scheduledAt = new Date(form.scheduled_at).toISOString();
    const recipients = [
      ...splitEmails(form.to).map((email) => ({ type: 'TO' as const, email })),
      ...splitEmails(form.cc).map((email) => ({ type: 'CC' as const, email })),
      ...splitEmails(form.bcc).map((email) => ({ type: 'BCC' as const, email }))
    ];

    await createEmail({
      subject: form.subject,
      body_html: form.body_html,
      from_name: form.from_name.trim() || undefined,
      from_alias: form.from_alias.trim() || undefined,
      scheduled_at: scheduledAt,
      recipients,
      attachments
    });

    form.subject = '';
    form.body_html = '';
    form.from_name = '';
    form.from_alias = '';
    form.to = '';
    form.cc = '';
    form.bcc = '';
    form.scheduled_at = '';
    files.value = [];
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Não foi possível agendar o email. Tente novamente em instantes.';
  }
}
</script>
