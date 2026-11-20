// frontend/src/main.js — Bootstrap Vue 3 pour la SPA privée /app-emela (DEC-151)
// Les bannières/prompts PWA restent désactivés : VitePWA est retiré et le SW
// historique est neutralisé par le killswitch L11.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Police Inter auto-hébergée (DEC-149) — définie dans tailwind.css via @font-face

// Tailwind (utilitaires + fonts)
import './assets/tailwind.css';

// MANDAT-14, E8 : la page servie dit de quel source elle vient et dans quel mode (identité posée au build par
// vite.config.js ; la même est déposée en build.json). P2 : « +modifié » ne prouve aucune version.
// `typeof` : en dehors d'une compilation Vite (tests Node), la constante n'existe pas.
const EMELA_BUILD = typeof __EMELA_BUILD__ !== 'undefined' ? __EMELA_BUILD__ : null;
if (EMELA_BUILD && typeof document !== 'undefined') {
  const meta = document.createElement('meta');
  meta.name = 'emela-build';
  meta.content = `sha=${EMELA_BUILD.sha || 'inconnu'};label=${EMELA_BUILD.label};mode=${EMELA_BUILD.mode}`;
  document.head.appendChild(meta);
  document.documentElement.dataset.emelaBuild = EMELA_BUILD.label;
}

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// R3: attendre que la navigation initiale soit résolue avant de monter.
// Sans cela, mount() s'exécute pendant que les chunks de route sont encore
// en transit (import() réseau), causant un crash nextSibling dans Vue.
router.isReady().then(() => {
  app.mount('#emela-app');
});
