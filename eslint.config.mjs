import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
    "**/dist/**",
    "**/build/**",
    "**/backups/**",
    "**/testsprite_tests/**",
    "**/*.bak",
    "prisma/dev.db",
    "prisma/prisma/dev.db",
  ]),
]);