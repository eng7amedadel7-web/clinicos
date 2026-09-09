import path from "node:path";
import { defineConfig } from "vitest/config";

// Standalone from vite.config.ts on purpose: tests run in plain node and
// don't need the react/tailwind plugin pipeline — only the "@" source alias.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
});
