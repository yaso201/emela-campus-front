<script setup>
// InstallBanner — bandeau discret proposant l'installation PWA
// Réf visuelle : F07 §7.1
import { ref, computed, onMounted } from 'vue';
import { usePwaStore } from '@/stores/pwa';

const pwa = usePwaStore();
const dismissed = ref(false);

const DISMISS_KEY = 'mela_install_dismissed';

onMounted(() => {
  try {
    dismissed.value = localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    dismissed.value = false;
  }
});

const visible = computed(() => pwa.canInstallNative && !dismissed.value);

async function handleInstall() {
  const outcome = await pwa.promptInstall();
  if (outcome === 'dismissed') {
    persistDismiss();
  }
}

function dismiss() {
  dismissed.value = true;
  persistDismiss();
}

function persistDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // silent : storage indisponible en mode privé
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-20 md:bottom-4 inset-x-4 z-toast bg-white rounded-lg border border-default shadow-md px-4 py-3 flex items-center gap-3 max-w-md mx-auto"
    role="region"
    aria-label="Invitation à installer mela"
  >
    <div class="w-10 h-10 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
      <span class="text-lg font-bold tracking-tight text-brand-900">
        m<span class="text-accent-500">.</span>
      </span>
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold text-neutral-950">Installer mela</div>
      <div class="text-xs text-neutral-600 mt-0.5">Accès rapide, fonctionne hors ligne</div>
    </div>
    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        type="button"
        class="text-xs font-semibold text-white bg-brand-900 hover:bg-brand-700 px-3 py-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[32px]"
        @click="handleInstall"
      >
        Installer
      </button>
      <button
        type="button"
        class="text-neutral-400 hover:text-neutral-600 p-1 focus:outline-none focus:ring-2 focus:ring-brand-500/25 rounded-sm"
        aria-label="Plus tard"
        @click="dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
