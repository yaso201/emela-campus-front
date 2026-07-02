/**
 * postbuild-sw-killswitch.js
 *
 * L11: Écrit un SW killswitch et un registerSW no-op dans le répertoire
 * de build après chaque `vite build`. Cela garantit que les navigateurs
 * ayant enregistré l'ancien SW Workbox le remplacent par un SW qui :
 *   1. s'installe immédiatement (skipWaiting)
 *   2. supprime les caches Workbox résiduels
 *   3. se désenregistre
 *   4. recharge les clients
 *
 * Le script URL historique est /assets/portal_app/emela/sw.js
 * et le scope est /assets/portal_app/emela/.
 *
 * VitePWA generait aussi manifest.webmanifest. Comme le build vide outDir,
 * le manifest est maintenu ici de facon statique tant que la PWA reste
 * desactivee.
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// F1 : cible dans le back campus, configurable comme vite.config (EMELA_BACK_PUBLIC).
// Défaut sain = arbre Campus local (scripts/ est 3 niveaux sous Campus).
const outDir =
  process.env.EMELA_BACK_PUBLIC ||
  resolve(__dirname, '../../../Backs/apps/portal_app/portal_app/public/emela');

const SW_KILLSWITCH = `// L11 — Service Worker killswitch
// Remplace l'ancien SW Workbox. Se désenregistre après activation.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', async () => {
  // Supprimer les caches Workbox résiduels
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('emela-') || name.startsWith('workbox-'))
      .map(name => caches.delete(name))
  );

  // Se désenregistrer
  await self.registration.unregister();

  // Recharger les clients pour qu'ils utilisent le réseau directement
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.navigate(client.url);
  }
});
`;

const REGISTER_NOOP = `// L11 — No-op. L'ancien registerSW.js enregistrait le SW Workbox.
// Ce fichier est maintenu vide pour ne pas provoquer de 404 si un
// ancien bundle le référence encore.
`;

const MANIFEST = {
  name: 'emela — Mon Espace LaNEM',
  short_name: 'emela',
  description: 'Votre espace numérique LaNEM',
  start_url: '/app-emela/',
  scope: '/app-emela/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#F8F7F4',
  theme_color: '#0C3547',
  lang: 'fr',
  categories: ['education', 'productivity'],
  icons: [
    {
      src: '/assets/portal_app/images/favicons/favicon.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

writeFileSync(resolve(outDir, 'sw.js'), SW_KILLSWITCH);
writeFileSync(resolve(outDir, 'registerSW.js'), REGISTER_NOOP);
writeFileSync(resolve(outDir, 'manifest.webmanifest'), `${JSON.stringify(MANIFEST, null, 2)}\n`);

console.log('[L11] sw.js killswitch + registerSW.js no-op + manifest écrits dans', outDir);
