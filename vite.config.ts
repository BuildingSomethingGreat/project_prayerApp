import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "media/*.jpg", "media/voices/*.mp3"],
      manifest: {
        name: "Liora — a quiet place to pray",
        short_name: "Liora",
        description: "Guided prayer and Scripture meditation, written for what's on your heart.",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        background_color: "#5a443b",
        theme_color: "#5a443b",
        categories: ["lifestyle", "health"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // The looping backdrops. App.tsx fills this cache with whole files;
            // the range plugin then answers the <video> element's byte-range requests from it.
            urlPattern: /\/media\/.*\.mp4$/,
            handler: "CacheFirst",
            options: { cacheName: "liora-media", rangeRequests: true, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { "/api": "http://localhost:8787" },
  },
});
