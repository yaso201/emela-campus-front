// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'icon-192.png',
        'icon-512.png',
        'icon-192-maskable.png',
        'icon-512-maskable.png',
      ],
      manifest: {
        name: 'mela — Mon Espace LaNEM',
        short_name: 'mela',
        description: 'Votre espace numérique LaNEM',
        start_url: '/mela',
        scope: '/mela/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F8F7F4',
        theme_color: '#0C3547',
        lang: 'fr',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(woff2?|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mela-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/assets\/portal_app\/mela\/chunks\/.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mela-chunks',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
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
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'mela.bundle.css';
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
