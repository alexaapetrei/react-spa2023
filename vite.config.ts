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
        // Precache every asset in the build output (JS chunks, CSS, images, JSON…)
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // SPA fallback: any navigation request that misses the precache (e.g.
        // /categoria/b/5 opened offline) gets served the cached index.html so
        // the client-side router can take over instead of showing a network error.
        navigateFallback: "/index.html",
        // Don't apply the fallback to browser-internal or Vite dev-server paths.
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
