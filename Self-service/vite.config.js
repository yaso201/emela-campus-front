// Self-service/vite.config.js — SPA emela self-service.
// F1 (02/07/2026) : extraite de portal_app/frontend vers Campus/Fronts/Self-service.
// Modèle « build-into-back » CONSERVÉ : le bundle atterrit dans le back campus
// (portal_app/public/emela) ; le shell app_emela.py le sert à l'identique.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cible du build dans le back campus. Chemin CONFIGURABLE (clone du seul front /
// multi-VPS futur) ; défaut sain = arbre Campus local (Fronts et Backs siblings).
const BACK_PUBLIC =
  process.env.EMELA_BACK_PUBLIC ||
  path.resolve(__dirname, '../../Backs/apps/portal_app/portal_app/public/emela');

// C6 — tokens servis au back (app_include_css). COPIE-AU-BUILD (pas de symlink
// cross-arbre) : le back reste autonome (clone seul + multi-VPS). Le back ne
// consomme que tokens.css ; cible = <back-public>/../design-system/tokens/tokens.css.
const BACK_TOKENS_DIR =
  process.env.EMELA_BACK_TOKENS ||
  path.resolve(BACK_PUBLIC, '../design-system/tokens');
const TOKENS_SRC = path.resolve(__dirname, '../shared/design-system/tokens/tokens.css');

function copyTokensToBack() {
  return {
    name: 'emela-copy-tokens-to-back',
    closeBundle() {
      mkdirSync(BACK_TOKENS_DIR, { recursive: true });
      copyFileSync(TOKENS_SRC, path.join(BACK_TOKENS_DIR, 'tokens.css'));
      // eslint-disable-next-line no-console
      console.log('[F1] tokens.css copié vers', BACK_TOKENS_DIR);
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    copyTokensToBack(),
    // L11: VitePWA retiré — le SW Workbox servait des assets stale.
    // Un killswitch sw.js est maintenu dans <back>/public/emela/
    // via le script postbuild. Ne pas réintroduire VitePWA sans
    // résoudre le scope /assets/portal_app/emela/ vs /app-emela/.
  ],
  base: '/assets/portal_app/emela/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@design': path.resolve(__dirname, '../shared/design-system'),
    },
  },
  build: {
    outDir: BACK_PUBLIC,
    emptyOutDir: true,
    target: 'es2021',
    sourcemap: false,
    rollupOptions: {
      input: { main: path.resolve(__dirname, 'src/main.js') },
      output: {
        entryFileNames: 'emela.bundle.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'emela.bundle.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port: 8080,
    strictPort: true,
    // F1 AMÉLIORATION (pas parité) : HMR (8080) proxifié vers le back campus (8000).
    // Aujourd'hui absent ; échec proxy ≠ blocage F1.
    proxy: {
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
      '/files': 'http://localhost:8000',
      '/private': 'http://localhost:8000',
      '/app': 'http://localhost:8000',
    },
  },
});
