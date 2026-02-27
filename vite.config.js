import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: false,
  },
  plugins: [],
  optimizeDeps: {
    // Force Vite to pre-bundle the entire Babylon.js packages
    // so dynamic shader imports don't 404
    include: [
      "@babylonjs/core",
      "@babylonjs/gui",
    ],
    esbuildOptions: {
      // Babylon.js needs this for proper bundling
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
  },
})
