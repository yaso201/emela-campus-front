// frontend/src/stores/pwa.js
// Store Pinia centralisant l'état PWA : offline, install prompt, update available.
import { defineStore } from 'pinia';

export const usePwaStore = defineStore('pwa', {
  state: () => ({
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    installPromptEvent: null,
    isInstallable: false,
    needRefresh: false,
    updateServiceWorker: null,
    isIos: false,
    isInStandaloneMode: false,
  }),
  getters: {
    canInstallNative: (state) =>
      state.isInstallable && !state.isIos && !state.isInStandaloneMode,
    canShowIosInstructions: (state) => state.isIos && !state.isInStandaloneMode,
  },
  actions: {
    init() {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

      // Détection iOS
      this.isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

      // Détection standalone (PWA déjà installée)
      this.isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone === true;

      // Listeners online/offline
      window.addEventListener('online', () => {
        this.isOffline = false;
      });
      window.addEventListener('offline', () => {
        this.isOffline = true;
      });

      // beforeinstallprompt (Chrome/Edge Android/Desktop)
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.installPromptEvent = e;
        this.isInstallable = true;
      });

      // Cleanup après installation réussie
      window.addEventListener('appinstalled', () => {
        this.installPromptEvent = null;
        this.isInstallable = false;
      });
    },

    async promptInstall() {
      if (!this.installPromptEvent) return 'unavailable';
      this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;
      this.installPromptEvent = null;
      this.isInstallable = false;
      return outcome;
    },

    setUpdateAvailable(updateFn) {
      this.needRefresh = true;
      this.updateServiceWorker = updateFn;
    },

    applyUpdate() {
      if (this.updateServiceWorker) {
        this.updateServiceWorker(true);
      }
    },
  },
});
