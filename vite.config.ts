import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";

const currentDate = new Date();
const timestamp = currentDate.getTime();

export default defineConfig({
  server: {
    port: 3030
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.img', 'bear2023.svg', 'img/*', 'img/a/*', 'img/b/*', 'img/c/*', 'img/d/*', 'data/*'],
      workbox: {
        cacheId: `urs-sur-${timestamp}`,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // swDest: 'dist/sw.js',
        // importScripts: [
        //   '/path/to/external/script1.js',
        //   '/path/to/external/script2.js',
        // ],
        // exclude: [
        //   /\.map$/, 
        //   /^manifest.*\.js?$/
        // ],
        // runtimeCaching: [
        //   {
        //     urlPattern: /api/,
        //     handler: 'NetworkFirst',
        //     options: {
        //       cacheName: 'api-cache',
        //       expiration: {
        //         maxEntries: 200,
        //         maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        //       },
        //       broadcastUpdate: {
        //         channelName: 'api-update-channel',
        //       },
        //     },
        //   },
        // ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          // Exclude URLs starting with /api/
          /^\/api\//,
        ],
        // directoryIndex: '/',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
      }
    })
  ],
});
