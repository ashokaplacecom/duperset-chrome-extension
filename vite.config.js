import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.jsx"),
      },
      output: {
        entryFileNames: "content.js",
      },
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});