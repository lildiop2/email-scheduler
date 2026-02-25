<template>
  <section class="grid gap-6 md:grid-cols-3">
    <div class="rounded-2xl bg-white p-6 shadow">
      <div class="text-sm text-slate-500">Agendados</div>
      <div class="mt-2 text-3xl font-semibold">{{ counts.scheduled }}</div>
    </div>
    <div class="rounded-2xl bg-white p-6 shadow">
      <div class="text-sm text-slate-500">Enviados</div>
      <div class="mt-2 text-3xl font-semibold">{{ counts.sent }}</div>
    </div>
    <div class="rounded-2xl bg-white p-6 shadow">
      <div class="text-sm text-slate-500">Falhas</div>
      <div class="mt-2 text-3xl font-semibold">{{ counts.failed }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { listEmails } from '../services/emails';

const counts = reactive({
  scheduled: 0,
  sent: 0,
  failed: 0
});

async function loadCounts() {
  const [scheduled, sent, failed] = await Promise.all([
    listEmails('SCHEDULED'),
    listEmails('SENT'),
    listEmails('FAILED')
  ]);
  counts.scheduled = scheduled.length ?? 0;
  counts.sent = sent.length ?? 0;
  counts.failed = failed.length ?? 0;
}

onMounted(loadCounts);
</script>
