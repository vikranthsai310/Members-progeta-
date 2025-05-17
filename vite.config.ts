import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Add component tagging in development mode
    ...(mode === 'development' ? [
      // @ts-ignore - Type issues with componentTagger options
      componentTagger({
        path: "src/pages",
        tags: ["page"],
        pattern: "*.tsx",
      }),
      // @ts-ignore - Type issues with componentTagger options
      componentTagger({
        path: "src/components",
        tags: ["component"],
        pattern: "*.tsx",
      })
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    // Configure for SPA client-side routing
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  // Base path for the site - important for routing
  base: "/",
}));
