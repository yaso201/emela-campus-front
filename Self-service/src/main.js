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
