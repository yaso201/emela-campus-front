// frontend/src/main.js — Bootstrap Vue 3 + PWA (Phase 6)
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { registerSW } from 'virtual:pwa-register';

// Polices auto-hébergées via @fontsource
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

// Tokens F01 (source de vérité visuelle)
import '@design/tokens/tokens.css';

// Tailwind (utilitaires)
import './assets/tailwind.css';

import { usePwaStore } from '@/stores/pwa';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Init PWA store AVANT le mount pour capturer beforeinstallprompt précoce
const pwa = usePwaStore(pinia);
pwa.init();

// Register service worker with manual update prompt
const updateSW = registerSW({
  onNeedRefresh() {
    pwa.setUpdateAvailable(updateSW);
  },
  onOfflineReady() {
    // eslint-disable-next-line no-console
    console.log('[PWA] mela est disponible hors ligne');
  },
});

app.mount('#mela-app');
