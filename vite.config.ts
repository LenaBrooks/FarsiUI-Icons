import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, "playground"),
  plugins: [react()],
  resolve: {
    alias: [
      // More specific first — otherwise `/icons` hits the package `dist` export.
      {
        find: "@farsiui/icons/icons",
        replacement: path.resolve(rootDir, "src/named-icons.ts"),
      },
      {
        find: "@farsiui/icons",
        replacement: path.resolve(rootDir, "src/index.ts"),
      },
    ],
  },
  build: {
    // Absolute path so Vercel Output Directory `playground/dist` matches (not nested under root).
    outDir: path.resolve(rootDir, "playground/dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: false,
  },
});
