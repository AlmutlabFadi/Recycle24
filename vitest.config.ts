import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",

    setupFiles: ["./src/test/setup.ts"],

    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],

    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/testsprite_tests/**",
      "**/backups/**"
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],

      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**"
      ]
    },

    clearMocks: true,
    restoreMocks: true,
    mockReset: true
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});