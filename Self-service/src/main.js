// frontend/src/main.js — Bootstrap Vue 3 pour la SPA privée /app-emela (DEC-151)
// Les bannières/prompts PWA restent désactivés : VitePWA est retiré et le SW
// historique est neutralisé par le killswitch L11.

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

// MANDAT-14 (lot 7 bis) : l'entrée n'exporte rien et n'importe l'application que dynamiquement. La page serveur la
// charge sous `?v=<mtime>` ; si un morceau de route l'importait, le navigateur l'évaluerait une seconde fois (deux
// applications, deux routeurs). L'application vit dans `boot.js` — voir son en-tête.
import('./boot.js');
