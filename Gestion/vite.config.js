import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * manifest.json au format exigé par CONTRAT-ARTEFACT-GESTION §2 :
 * { "js": ["assets/….js"], "css": ["assets/….css"] } — les fichiers d'ENTREE,
 * chemins relatifs au dist. Le shell serveur les injecte ; index.html est ignore
 * (le shell EST la page).
 */
function contratManifest() {
  return {
    name: 'contrat-artefact-manifest',
    apply: 'build',
    enforce: 'post',        // ⚠️ SANS CETTE LIGNE le CSS sort vide du manifeste
    generateBundle(_options, bundle) {
      const js = [];
      const css = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) js.push(fileName);
        else if (chunk.type === 'asset' && fileName.endsWith('.css')) css.push(fileName);
      }
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify({ js, css }, null, 2) + '\n',
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), contratManifest()],
  base: './',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', assetsDir: 'assets', cssCodeSplit: false },
});
