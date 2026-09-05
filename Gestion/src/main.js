import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { tip } from './directives/tip.js';
import './assets/main.css';

// CORRECTION D'UNE LIGNE (mandat branchement §8, à reverser) : le CONTRAT
// sert le point de montage #gestion-app — '#app' n'existe que dans le
// index.html du dev local (que le shell serveur IGNORE).
// M3 AN-10 : v-tip = LE mécanisme d'infobulle partagé (survol + focus clavier).
createApp(App).use(router).directive('tip', tip).mount('#gestion-app');
