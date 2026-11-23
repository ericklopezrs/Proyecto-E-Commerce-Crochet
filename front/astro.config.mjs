// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { AstroPWAIntegration as AstroPWA } from '@vite-pwa/astro';

// Colores de la marca: los mismos tokens que están en src/styles/App.css (:root)
const COLOR_PRIMARIO = '#baa2f3'; // --color-primario (header y footer)
const COLOR_FONDO = '#f1f5f9';    // --color-fondo (fondo de la tienda)

export default defineConfig({
  output: 'server',
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['iconocrochet.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Peluches Crochet — Tienda de amigurumis',
        short_name: 'Peluches Crochet',
        description: 'Tienda en línea de peluches tejidos a mano.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: COLOR_PRIMARIO,
        background_color: COLOR_FONDO,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/capturas/tienda_escritorio.png', sizes: '2196x2196', type: 'image/png', form_factor: 'wide', label: 'Catálogo en escritorio' },
          { src: '/capturas/tienda_celular.png', sizes: '1179x2556', type: 'image/png', label: 'Catálogo en celular' },
        ],
      },
      injectManifest: {
        swSrc: fileURLToPath(new URL('./src/sw.js', import.meta.url)),
        globPatterns: ['**/*.{css,js,svg,png,ico,webp,woff2,html}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  adapter: vercel(),
});