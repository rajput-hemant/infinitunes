import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],

  // path alias
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // dev server
  server: {
    host: true, // needed for the Docker Container port mapping to work
    port: 5173,
  },
});
