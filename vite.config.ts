import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    mode === "development" && dyadComponentTagger(),
    react(),
  ].filter(Boolean),
  optimizeDeps: {
    exclude: ["posthog-js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./supabase/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  esbuild: {
    pure: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-clerk": ["@clerk/clerk-react"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-leaflet": ["leaflet", "react-leaflet", "react-leaflet-cluster"],
          "vendor-recharts": ["recharts"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod", "class-variance-authority"],
          "vendor-sonner": ["sonner"],
        },
      },
    },
  },
}));
