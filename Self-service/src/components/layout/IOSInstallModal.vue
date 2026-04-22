<script setup>
// IOSInstallModal — instructions manuelles d'installation pour iOS/Safari
// Réf visuelle : F07 §7.3
import { ref, onMounted, computed } from 'vue';
import { usePwaStore } from '@/stores/pwa';

const pwa = usePwaStore();
const dismissed = ref(false);
const shown = ref(false);

const DISMISS_KEY = 'mela_ios_install_dismissed';

onMounted(() => {
  try {
    dismissed.value = localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    dismissed.value = false;
  }
  // Délai avant affichage pour éviter le spam au premier chargement
  setTimeout(() => {
    shown.value = true;
  }, 3000);
});

const visible = computed(
  () => pwa.canShowIosInstructions && shown.value && !dismissed.value,
);

function dismiss() {
  dismissed.value = true;
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // silent
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-modal bg-black/50 flex items-end sm:items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ios-install-title"
  >
    <div class="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg">
      <h2 id="ios-install-title" class="text-base font-bold text-ln-gray-900 mb-4">
        Installer emela sur iPhone
      </h2>

      <ol class="space-y-3 text-sm text-ln-gray-700">
        <li class="flex items-start gap-3">
          <span
            class="w-6 h-6 rounded-full bg-ln-blue-50 text-ln-blue-900 text-xs font-bold flex items-center justify-center flex-shrink-0"
          >1</span>
          <span>
            Appuyez sur l'icône de partage
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              class="inline-block align-middle mx-1"
            >
              <path
                d="M12 2v13M7 7l5-5 5 5M20 17v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            en bas de Safari
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span
            class="w-6 h-6 rounded-full bg-ln-blue-50 text-ln-blue-900 text-xs font-bold flex items-center justify-center flex-shrink-0"
          >2</span>
          <span>Faites défiler et sélectionnez <strong>« Sur l'écran d'accueil »</strong></span>
        </li>
        <li class="flex items-start gap-3">
          <span
            class="w-6 h-6 rounded-full bg-ln-blue-50 text-ln-blue-900 text-xs font-bold flex items-center justify-center flex-shrink-0"
          >3</span>
          <span>Appuyez sur <strong>« Ajouter »</strong> en haut à droite</span>
        </li>
      </ol>

      <button
        type="button"
        class="mt-6 w-full text-sm font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-4 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        @click="dismiss"
      >
        Compris
      </button>
    </div>
  </div>
</template>
