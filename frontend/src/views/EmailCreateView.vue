<template>
  <div class="rounded-2xl bg-white p-8 shadow">
    <h1 class="mb-6 text-2xl font-semibold">Criar Email</h1>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-2 block text-sm font-medium">Assunto</label>
        <input v-model="form.subject" class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Corpo (HTML)</label>
        <textarea v-model="form.body_html" class="h-40 w-full rounded border border-slate-200 px-3 py-2"></textarea>
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
        <input class="w-full rounded border border-slate-200 px-3 py-2" type="file" multiple @change="handleFiles" />
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
import { reactive, ref } from 'vue';
import { z } from 'zod';
import { createEmail, presignAttachment } from '../services/emails';

const error = ref('');
const files = ref<File[]>([]);

const form = reactive({
  subject: '',
  body_html: '',
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
  files.value = target.files ? Array.from(target.files) : [];
}

async function handleSubmit() {
  error.value = '';
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    error.value = 'Preencha assunto, corpo e data.';
    return;
  }

  try {
    const attachments = await Promise.all(files.value.map((file) => presignAttachment(file)));
    const scheduledAt = new Date(form.scheduled_at).toISOString();
    const recipients = [
      ...splitEmails(form.to).map((email) => ({ type: 'TO' as const, email })),
      ...splitEmails(form.cc).map((email) => ({ type: 'CC' as const, email })),
      ...splitEmails(form.bcc).map((email) => ({ type: 'BCC' as const, email }))
    ];

    await createEmail({
      subject: form.subject,
      body_html: form.body_html,
      scheduled_at: scheduledAt,
      recipients,
      attachments
    });

    form.subject = '';
    form.body_html = '';
    form.to = '';
    form.cc = '';
    form.bcc = '';
    form.scheduled_at = '';
    files.value = [];
  } catch {
    error.value = 'Falha ao agendar email.';
  }
}
</script>
