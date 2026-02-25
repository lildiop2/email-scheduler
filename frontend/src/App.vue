<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3 text-xl font-semibold">
          <font-awesome-icon icon="envelope" class="text-slate-700" />
          Email Scheduler
        </div>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink class="text-slate-600 hover:text-slate-900" to="/">Dashboard</RouterLink>
          <RouterLink class="text-slate-600 hover:text-slate-900" to="/emails/new">Criar Email</RouterLink>
          <RouterLink class="text-slate-600 hover:text-slate-900" to="/emails">Emails</RouterLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>
