import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Standalone from vite.config.ts on purpose: tests don't need tailwind or the
// replit dev plugins — but the react plugin IS required, because tsconfig
// sets "jsx": "preserve" for the build and something must transform .tsx.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
});
