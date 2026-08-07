import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const applicationDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(applicationDirectory, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@reviewable-intake/core": path.join(
        repositoryDirectory,
        "packages/core/src/index.ts",
      ),
      "@reviewable-intake/fixtures": path.join(
        repositoryDirectory,
        "packages/fixtures/src/index.ts",
      ),
    },
  },
});
