import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  optimizeDeps: {
    exclude: ["posthog-js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Increase warning threshold (our chunks are intentionally split)
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Split vendor libraries into separate cached chunks.
        // Users download these ONCE and the browser caches them.
        // Only your app code re-downloads on updates.
        manualChunks: {
          // React core — almost never changes
          "vendor-react": ["react", "react-dom"],

          // React Router — stable
          "vendor-router": ["react-router-dom"],

          // Clerk auth — only loads once
          "vendor-clerk": ["@clerk/clerk-react"],

          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],

          // Leaflet maps — only loads on map-heavy pages (trip/shipment detail)
          "vendor-leaflet": ["leaflet", "react-leaflet", "react-leaflet-cluster"],

          // Recharts — only loads on dashboard / chart pages
          "vendor-recharts": ["recharts"],

          // TanStack Query (data fetching)
          "vendor-query": ["@tanstack/react-query"],

          // Framer Motion — animation library (kept out of the app shell)
          "vendor-motion": ["framer-motion"],

          // Forms + validation
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod", "class-variance-authority"],

          // Toast notifications
          "vendor-sonner": ["sonner"],
        },
      },
    },
  },
}));
