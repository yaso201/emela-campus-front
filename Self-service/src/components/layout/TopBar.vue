<script setup>
// TopBar — barre supérieure responsive (wordmark mobile / greeting desktop)
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

defineProps({
  mobile: { type: Boolean, default: false },
});

const auth = useAuthStore();

const today = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const greeting = computed(() => `Bonjour, ${auth.displayName}`);
</script>

<template>
  <header
    v-if="mobile"
    class="flex items-center justify-between px-4 py-3 bg-white border-b border-subtle"
  >
    <span class="text-xl font-bold tracking-tight text-neutral-950">
      mela<span class="text-accent-500">.</span>
    </span>
    <div
      class="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-900"
      :aria-label="auth.displayName"
    >
      {{ auth.initials }}
    </div>
  </header>

  <header
    v-else
    class="flex items-start justify-between px-10 pt-8 pb-6"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-neutral-950">{{ greeting }}</h1>
      <p class="text-sm text-neutral-600 mt-1">{{ auth.isGuest ? 'Non connecté' : auth.user }}</p>
    </div>
    <div class="text-xs text-neutral-500 first-letter:uppercase">{{ today }}</div>
  </header>
</template>
