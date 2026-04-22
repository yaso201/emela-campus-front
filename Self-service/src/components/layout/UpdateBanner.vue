<script setup>
// UpdateBanner — bandeau non intrusif quand une nouvelle version est disponible
// Réf UX : F07 §3.3 — ne jamais forcer le rechargement
import { ref } from 'vue';
import { usePwaStore } from '@/stores/pwa';

const pwa = usePwaStore();
const dismissed = ref(false);

function applyUpdate() {
  pwa.applyUpdate();
}

function dismiss() {
  dismissed.value = true;
}
</script>

<template>
  <div
    v-if="pwa.needRefresh && !dismissed"
    class="fixed top-0 inset-x-0 z-50 bg-ln-blue-900 text-white px-4 py-2.5 flex items-center justify-between gap-3"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center gap-2 text-xs font-medium">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="flex-shrink-0">
        <path d="M21 12a9 9 0 11-3.5-7.14M21 4v5h-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Une nouvelle version de emela est disponible.</span>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        class="text-xs font-semibold bg-white text-ln-blue-900 px-3 py-1.5 rounded-sm hover:bg-ln-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-ln-blue-900 focus:ring-white min-h-[32px]"
        @click="applyUpdate"
      >
        Mettre à jour
      </button>
      <button
        type="button"
        class="text-white/70 hover:text-white p-1 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-ln-blue-900 focus:ring-white rounded-sm"
        aria-label="Ignorer"
        @click="dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
