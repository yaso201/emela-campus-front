// frontend/src/boot.js — l'AMORCE de la SPA privée /app-emela : l'application, le magasin, le routeur, le montage.
//
// MANDAT-14 (lot 7 bis, §3.28 du rapport) : l'entrée (`main.js`) ne fait plus qu'importer ce module. La page serveur
// charge l'entrée sous `emela.bundle.js?v=<mtime>` ; tant que l'application y vivait, chaque morceau de route
// l'importait sous `../emela.bundle.js`, SANS la requête — le navigateur évaluait l'entrée deux fois : deux
// applications, deux routeurs, des `RouterLink` et des `useRoute()` sans routeur au premier rendu d'une page chargée
// directement, et chaque lecture du démarrage faite deux fois. Ici, l'application vit dans un morceau haché, importé par
// tous sous le même nom : une seule copie de chaque module.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// R3 : monter après la navigation initiale résolue. Relu au lot 7 (VERDICT-MANDAT-14-PC1D §6) : le « crash
// nextSibling » qu'il contournait venait très probablement de la double évaluation de l'entrée (deux applications
// montées sur #emela-app), corrigée ci-dessus. Gardé pour son objet propre : la garde du routeur (routeAdmits, P8)
// décide avant le premier rendu — une page chargée directement ne s'affiche pas sous une route qu'elle refusera.
router.isReady().then(() => {
  app.mount('#emela-app');
});
