// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  base: '/assets/portal_app/mela/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@design': path.resolve(__dirname, '../design-system'),
    },
  },
  build: {
    outDir: '../portal_app/public/mela',
    emptyOutDir: true,
    target: 'es2021',
    sourcemap: false,
    rollupOptions: {
      input: { main: path.resolve(__dirname, 'src/main.js') },
      output: {
        entryFileNames: 'mela.bundle.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // CSS principal → nom fixe pour référencement Jinja2
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'mela.bundle.css';
          }
          // Polices et autres assets → avec hash pour cache-busting
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
