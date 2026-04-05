// frontend/src/main.js — Bootstrap Vue 3 avec Pinia + Router (Phase 3)
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Polices auto-hébergées via @fontsource
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

// Tokens F01 (source de vérité visuelle)
import '@design/tokens/tokens.css';

// Tailwind (utilitaires)
import './assets/tailwind.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#mela-app');
