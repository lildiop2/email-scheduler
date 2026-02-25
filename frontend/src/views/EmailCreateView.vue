<template>
  <div class="rounded-2xl bg-white p-8 shadow">
    <h1 class="mb-6 text-2xl font-semibold">Criar Email</h1>
    <form class="space-y-4">
      <div>
        <label class="mb-2 block text-sm font-medium">Assunto</label>
        <input class="w-full rounded border border-slate-200 px-3 py-2" type="text" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Corpo (HTML)</label>
        <textarea class="h-40 w-full rounded border border-slate-200 px-3 py-2"></textarea>
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Destinatários (TO/CC/BCC)</label>
        <input class="w-full rounded border border-slate-200 px-3 py-2" type="text" placeholder="email@dominio.com" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Anexos</label>
        <input class="w-full rounded border border-slate-200 px-3 py-2" type="file" multiple />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium">Agendar para</label>
        <input class="w-full rounded border border-slate-200 px-3 py-2" type="datetime-local" />
      </div>
      <button class="rounded bg-slate-900 px-4 py-2 text-white">Agendar</button>
    </form>
  </div>
</template>
