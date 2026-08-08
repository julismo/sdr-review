import { readFile } from "node:fs/promises";

const requiredFiles = [
  "README.md",
  "ARCHITECTURE.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "PROVENANCE.md",
  "LICENSE",
  "docs/data-boundary.md",
  "docs/extension-guide.md",
  ".github/workflows/ci.yml",
];

const requiredWorkflowTokens = [
  "npm ci",
  "npm run lint",
  "npm run typecheck",
  "npm run test",
  "npm run test:scanner",
  "npm run build",
  "npm run test:e2e",
  "npm run verify:release-docs",
  "fetch-depth: 0",
  "npm run scan:public-safety",
  "git rev-list --all",
];

for (const file of requiredFiles) {
  await readFile(file, "utf8");
}

const workflow = await readFile(".github/workflows/ci.yml", "utf8");
for (const token of requiredWorkflowTokens) {
  if (!workflow.includes(token)) {
    throw new Error("CI workflow is missing required command: " + token);
  }
}
