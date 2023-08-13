import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server:{
port:3030
  },
  plugins: [
    react(),
    VitePWA({
      strategies:'injectManifest',
      filename: 'pwa-sw.js',
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
