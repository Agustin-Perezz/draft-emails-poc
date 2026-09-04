import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "text-summary", "lcov", "clover"],
      reportsDirectory: "./coverage",
      include: ["src/app/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/sentry.client.config.ts",
        "src/sentry.edge.config.ts",
        "src/sentry.server.config.ts",
        "src/instrumentation.ts",
      ],
    },
  },
});
