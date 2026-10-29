import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // El manifest base (se sobreescribe por ruta via usePWAManifest)
      manifest: {
        name: 'Rincóncito de la Costeña',
        short_name: 'Rincóncito 🐚',
        description: 'Sistema de pedidos en tiempo real',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#023e8a',
        theme_color: '#0077b6',
        icons: [
          { src: '/icons/icon-mesero.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      // Cachear assets del app shell
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Cache de las llamadas a la API del backend (red primero, cache fallback)
            urlPattern: ({ url }) => url.port === '3001',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      // Incluir los manifests estáticos en el build
      includeAssets: [
        'manifest-mesero.json',
        'manifest-cocina.json',
        'manifest-admin.json',
        'icons/*.svg',
      ],
      devOptions: {
        enabled: true,          // activar SW también en dev
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
  },
})
