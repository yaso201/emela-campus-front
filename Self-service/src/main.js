// frontend/src/main.js — Bootstrap Vue 3 minimal (Phase 0)
// Pinia et Vue Router seront ajoutés en Phase 3 quand ils sont effectivement utilisés.
import { createApp } from 'vue';
import App from './App.vue';

// Polices auto-hébergées via @fontsource (4 graisses Plus Jakarta Sans)
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

// Tokens F01 (source de vérité visuelle)
import '@design/tokens/tokens.css';

// Tailwind (utilitaires)
import './assets/tailwind.css';

const app = createApp(App);
app.mount('#mela-app');
