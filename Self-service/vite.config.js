// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    // L11: VitePWA retiré — le SW Workbox servait des assets stale.
    // Un killswitch sw.js est maintenu dans portal_app/public/emela/
    // via le script postbuild. Ne pas réintroduire VitePWA sans
    // résoudre le scope /assets/portal_app/emela/ vs /app-emela/.
  ],
  base: '/assets/portal_app/emela/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@design': path.resolve(__dirname, '../design-system'),
    },
  },
  build: {
    outDir: '../portal_app/public/emela',
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
  },
});
