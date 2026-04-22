<script setup>
// OfflineBanner — bandeau top affiché quand l'utilisateur est hors ligne
// Réf visuelle : F07 §5.2
import { usePwaStore } from '@/stores/pwa';

const pwa = usePwaStore();
</script>

<template>
  <div
    v-if="pwa.isOffline"
    class="fixed top-0 inset-x-0 z-50 bg-ln-warning-bg border-b border-ln-warning/20 text-ln-warning text-xs font-medium px-4 py-2 flex items-center justify-center gap-2"
    role="status"
    aria-live="polite"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      class="flex-shrink-0"
    >
      <path
        d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>Mode hors ligne — données en cache</span>
  </div>
</template>
