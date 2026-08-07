import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@reviewable-intake/core": path.join(rootDirectory, "packages/core/src/index.ts"),
      "@reviewable-intake/fixtures": path.join(
        rootDirectory,
        "packages/fixtures/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./apps/demo/src/test/setup.ts"],
    include: ["apps/**/*.test.ts?(x)", "packages/**/*.test.ts"],
  },
});
