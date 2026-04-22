<script setup>
// BlockError — état erreur avec bouton retry optionnel
defineProps({
  title: { type: String, default: 'Impossible de charger ce bloc' },
  message: { type: String, default: '' },
  retry: { type: Function, default: null },
});
</script>

<template>
  <div
    class="bg-white rounded-lg border border-ln-gray-200 p-6 flex items-start gap-3"
    role="alert"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      class="flex-shrink-0 mt-0.5 text-ln-error"
      role="img"
      aria-label="Erreur"
    >
      <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
      <path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold text-ln-gray-900">{{ title }}</div>
      <div v-if="message" class="text-xs text-ln-gray-600 mt-1">{{ message }}</div>
      <button
        v-if="retry"
        type="button"
        class="mt-3 inline-flex items-center text-xs font-semibold text-ln-blue-900 hover:text-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 rounded-sm px-2 py-1 -ml-2"
        @click="retry"
      >
        Réessayer
      </button>
    </div>
  </div>
</template>
