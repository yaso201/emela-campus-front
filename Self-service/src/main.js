// frontend/src/main.js — Bootstrap Vue 3 (PWA désactivée)
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// PWA désactivée — scope SW incompatible avec /mela/ (audit 2026-04-06)
// import { registerSW } from 'virtual:pwa-register';

// Polices auto-hébergées via @fontsource
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

// Tokens F01 (source de vérité visuelle)
import '@design/tokens/tokens.css';

// Tailwind (utilitaires)
import './assets/tailwind.css';

// PWA désactivée — scope SW incompatible avec /mela/
// import { usePwaStore } from '@/stores/pwa';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// PWA désactivée — scope SW incompatible avec /mela/ (audit 2026-04-06)
// Réactiver quand sw.js sera servi depuis /mela/sw.js via website_route_rule
// ou quand le serveur enverra Service-Worker-Allowed: /mela/
// const pwa = usePwaStore(pinia);
// pwa.init();
// const updateSW = registerSW({
//   onNeedRefresh() {
//     pwa.setUpdateAvailable(updateSW);
//   },
//   onOfflineReady() {
//     console.log('[PWA] mela est disponible hors ligne');
//   },
// });

app.mount('#mela-app');
