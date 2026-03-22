import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  server: {
    port: 3030,
    fs: {
      allow: [".."],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    // Native tsconfig path resolution — replaces the vite-tsconfig-paths plugin
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        // Precache everything: app shell + all 576 question images.
        // Offline-first means the full dataset must be available at install time.
        globPatterns: ["**/*.{js,css,html,json,svg,png,jpg,jpeg,ico,webmanifest,txt}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // SPA fallback for offline deep-links
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/__/],
      },
      manifest: {
        name: "UrsSur",
        short_name: "UrsSur",
        scope: "/",
        start_url: "/",
        orientation: "any",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        theme_color: "#82ff89",
        background_color: "#82ff89",
        display: "standalone",
      },
    }),
  ],
});
