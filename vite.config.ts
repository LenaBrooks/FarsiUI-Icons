import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, "playground"),
  plugins: [react()],
  resolve: {
    alias: {
      "@farsiui/icons": path.resolve(rootDir, "src/index.ts"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
