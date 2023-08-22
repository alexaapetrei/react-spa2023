import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";

const currentDate = new Date();
const timestamp = currentDate.getTime();

export default defineConfig({
  server: {
    port: 3030
  },
  // build: {
  //   assetsInlineLimit: 0,
  //   rollupOptions: {
  //     output: {
  //       entryFileNames: `[name].js`,
  //       chunkFileNames: `[name].js`,
  //       assetFileNames: `[name].[ext]`
  //     }
  //   },
  // },
  plugins: [
    react(),
    VitePWA({
      // registerType: 'autoUpdate',
      includeAssets: ['favicon.img', 'bear2023.svg', 'img/*', 'img/a/*', 'img/b/*', 'img/c/*', 'img/d/*', 'data/*'],
      workbox: {
        cacheId: `urs-sur-${timestamp}`,
        // skipWaiting: true,
        // clientsClaim: true,
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
        //     urlPattern: /^https:\/\/test\.urssur\.com\//,
        //     handler: 'NetworkFirst',
        //     options: {
        //       cacheName: 'app-update-cache',
        //       expiration: {
        //         maxEntries: 800,
        //         maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        //       },
        //       broadcastUpdate: {
        //         channelName: 'app-update-channel',
        //         options: { // Add this object
        //           headersToCheck: [], // List headers to check for changes (if needed)
        //         }
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
