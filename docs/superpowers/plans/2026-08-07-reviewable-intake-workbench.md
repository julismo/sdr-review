# Reviewable Intake Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a clean-room, local-only open-source workbench with a reusable deterministic intake-policy core and an accessible React demo for reviewing six synthetic B2B requests.

**Architecture:** The repository is an npm-workspaces monorepo. The framework-independent core owns validation, policy evaluation, workflow transitions, and immutable audit events; the React demo consumes that core through a local persistence adapter and never makes a network request. Fixtures are a separate synthetic-only package shared by tests and the demo.

**Tech Stack:** Node.js 24, npm workspaces, TypeScript strict mode, React 19, Vite 8, Vitest 4, Testing Library, Playwright, ESLint 10, GitHub Actions, MIT.

## Global Constraints

- Public source, comments, docs, commit messages, UI copy, and issue templates are English.
- Create every implementation file from this specification; do not copy source, schemas, copy, assets, tests, or Git history from any non-public project.
- The application must not require credentials, environment variables, accounts, analytics, network access, authentication, a database, an AI model, email addresses, phone numbers, real organisations, or real people.
- Use only six synthetic fixture records. Use reserved IDs and invented organisation labels.
- Keep the core independent of React, browser APIs, and persistence details.
- Use TypeScript strict mode. Do not introduce the any type, disabled lint rules, or unchecked casts.
- Keep browser persistence under the single key reviewable-intake-workbench.snapshot.v1. Reset may remove only that key.
- Every behavior change follows red-green-refactor: add a focused failing test, run it, add the smallest implementation, rerun it, then commit the task.
- Run npm run lint, npm run typecheck, npm run test, and npm run build before each implementation-branch handoff. Run npm run test:e2e after browser setup.

---

## Planned File Structure

~~~~text
package.json
package-lock.json
tsconfig.json
eslint.config.js
vitest.config.ts
playwright.config.ts
.gitignore
.github/workflows/ci.yml
LICENSE
README.md
ARCHITECTURE.md
SECURITY.md
CONTRIBUTING.md
PROVENANCE.md
docs/
  data-boundary.md
  extension-guide.md
  superpowers/plans/2026-08-07-reviewable-intake-workbench.md
scripts/
  verify-release-docs.mjs
apps/demo/
  package.json
  index.html
  vite.config.ts
  src/
    main.tsx
    App.tsx
    App.test.tsx
    styles.css
    test/setup.ts
    lib/localSnapshot.ts
    lib/localSnapshot.test.ts
    hooks/useDemoWorkflow.ts
    components/
      RequestQueue.tsx
      RequestDetail.tsx
      PolicyResults.tsx
      ReviewActions.tsx
      AuditTimeline.tsx
packages/core/
  package.json
  src/
    types.ts
    validation.ts
    validation.test.ts
    policy.ts
    policy.test.ts
    workflow.ts
    workflow.test.ts
    index.ts
packages/fixtures/
  package.json
  src/
    index.ts
    index.test.ts
e2e/
  review-workflow.spec.ts
~~~~

### Task 1: Create the workspace and prove the React shell

**Files:**

- Create: package.json
- Create: tsconfig.json
- Create: eslint.config.js
- Create: vitest.config.ts
- Create: .gitignore
- Create: apps/demo/package.json
- Create: apps/demo/index.html
- Create: apps/demo/vite.config.ts
- Create: apps/demo/src/main.tsx
- Create: apps/demo/src/App.tsx
- Create: apps/demo/src/App.test.tsx
- Create: apps/demo/src/styles.css
- Create: apps/demo/src/test/setup.ts
- Create: packages/core/package.json
- Create: packages/fixtures/package.json

**Interfaces:**

- Produces the workspace aliases @reviewable-intake/core and @reviewable-intake/fixtures.
- Produces the demo root element with the accessible heading Reviewable Intake Workbench.

- [ ] **Step 1: Add the smallest failing shell test.**

~~~~tsx
// apps/demo/src/App.test.tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the public workbench heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Reviewable Intake Workbench" }),
    ).toBeInTheDocument();
  });
});
~~~~

- [ ] **Step 2: Run the focused test and confirm it fails because the workspace and component do not exist.**

Run: npm run test -- apps/demo/src/App.test.tsx  
Expected: FAIL with a missing package, test configuration, or App module error.

- [ ] **Step 3: Add the npm workspace, strict TypeScript, lint, Vite, and Vitest configuration.**

~~~~json
// package.json
{
  "name": "reviewable-intake-workbench",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace @reviewable-intake/demo",
    "build": "npm run build --workspace @reviewable-intake/demo",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^26.1.2",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.0.5",
    "eslint": "^10.8.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.3",
    "globals": "^17.9.0",
    "jsdom": "^29.1.1",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.66.0",
    "vite": "^8.2.1",
    "vitest": "^4.1.10"
  }
}
~~~~

~~~~json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vitest/globals"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@reviewable-intake/core": ["packages/core/src/index.ts"],
      "@reviewable-intake/fixtures": ["packages/fixtures/src/index.ts"]
    }
  },
  "include": ["apps", "packages", "vitest.config.ts", "playwright.config.ts"]
}
~~~~

~~~~js
// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "playwright-report", "test-results"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
~~~~

~~~~ts
// vitest.config.ts
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
~~~~

~~~~json
// apps/demo/package.json
{
  "name": "@reviewable-intake/demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@reviewable-intake/core": "file:../../packages/core",
    "@reviewable-intake/fixtures": "file:../../packages/fixtures",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  }
}
~~~~

~~~~json
// packages/core/package.json
{
  "name": "@reviewable-intake/core",
  "version": "0.1.0",
  "private": true,
  "type": "module"
}
~~~~

~~~~json
// packages/fixtures/package.json
{
  "name": "@reviewable-intake/fixtures",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@reviewable-intake/core": "file:../core"
  }
}
~~~~

~~~~ts
// apps/demo/vite.config.ts
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
~~~~

~~~~html
<!-- apps/demo/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="A local-only reference workbench for deterministic intake review."
    />
    <title>Reviewable Intake Workbench</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
~~~~

~~~~tsx
// apps/demo/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The application root is unavailable.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
~~~~

~~~~tsx
// apps/demo/src/App.tsx
export default function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">Local-only reference implementation</p>
      <h1>Reviewable Intake Workbench</h1>
      <p>
        Synthetic requests, deterministic recommendations, and human review
        will appear here.
      </p>
    </main>
  );
}
~~~~

~~~~ts
// apps/demo/src/test/setup.ts
import "@testing-library/jest-dom/vitest";
~~~~

~~~~css
/* apps/demo/src/styles.css */
:root {
  color: #14213d;
  background: #f7f8fb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  max-width: 72rem;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.eyebrow {
  color: #52606d;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
~~~~

~~~~gitignore
# .gitignore
node_modules/
dist/
coverage/
playwright-report/
test-results/
.env
.env.*
!.env.example
~~~~

- [ ] **Step 4: Install dependencies and run the focused test to make it pass.**

Run: npm install  
Run: npm run test -- apps/demo/src/App.test.tsx  
Expected: PASS with one passing test.

- [ ] **Step 5: Run the workspace quality baseline and commit.**

Run: npm run lint  
Run: npm run typecheck  
Run: npm run build  
Expected: all commands exit 0.

~~~~powershell
git add package.json package-lock.json tsconfig.json eslint.config.js vitest.config.ts .gitignore apps packages
git commit -m "chore: scaffold reviewable intake workspace"
~~~~

### Task 2: Implement strict request validation in the reusable core

**Files:**

- Create: packages/core/src/types.ts
- Create: packages/core/src/validation.ts
- Create: packages/core/src/validation.test.ts
- Create: packages/core/src/index.ts

**Interfaces:**

- Produces IntakeRequest, IntakeIntent, DataSensitivity, ValidationResult, and validateRequest.
- Consumes plain request input only; no framework, browser, or persistence APIs.

- [ ] **Step 1: Write failing validation tests.**

~~~~ts
// packages/core/src/validation.test.ts
import { validateRequest } from "./validation";

const validRequest = {
  id: "req-aurora",
  company: "Aurora Fieldworks",
  intent: "evaluate" as const,
  dataSensitivity: "standard" as const,
  consent: true,
  scope: "Evaluate a deterministic review workflow for a small operations team.",
  context: "The team needs a transparent recommendation before human follow-up.",
};

describe("validateRequest", () => {
  it("normalizes a valid synthetic request", () => {
    expect(validateRequest(validRequest)).toEqual({
      ok: true,
      value: validRequest,
    });
  });

  it("rejects missing consent before policy evaluation", () => {
    expect(
      validateRequest({
        ...validRequest,
        consent: false,
      }),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "consent",
          message: "Consent is required before a request can be evaluated.",
        },
      ],
    });
  });

  it("returns all actionable field errors", () => {
    expect(
      validateRequest({
        ...validRequest,
        company: " ",
        scope: "Short",
      }),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "company",
          message: "Company must contain at least two visible characters.",
        },
        {
          field: "scope",
          message: "Scope must contain at least twelve visible characters.",
        },
      ],
    });
  });
});
~~~~

- [ ] **Step 2: Run the focused test and confirm it fails because the core modules are absent.**

Run: npm run test -- packages/core/src/validation.test.ts  
Expected: FAIL with a missing validation module error.

- [ ] **Step 3: Implement immutable domain types and validation.**

~~~~ts
// packages/core/src/types.ts
export const intakeIntents = ["explore", "evaluate", "implement"] as const;
export type IntakeIntent = (typeof intakeIntents)[number];

export const dataSensitivities = ["standard", "restricted"] as const;
export type DataSensitivity = (typeof dataSensitivities)[number];

export interface IntakeRequest {
  readonly id: string;
  readonly company: string;
  readonly intent: IntakeIntent;
  readonly dataSensitivity: DataSensitivity;
  readonly consent: boolean;
  readonly scope: string;
  readonly context?: string;
}

export type RequestField =
  | "id"
  | "company"
  | "intent"
  | "dataSensitivity"
  | "consent"
  | "scope"
  | "context";

export interface ValidationError {
  readonly field: RequestField;
  readonly message: string;
}

export type ValidationResult =
  | {
      readonly ok: true;
      readonly value: IntakeRequest;
    }
  | {
      readonly ok: false;
      readonly errors: readonly ValidationError[];
    };
~~~~

~~~~ts
// packages/core/src/validation.ts
import {
  dataSensitivities,
  intakeIntents,
  type IntakeRequest,
  type RequestField,
  type ValidationError,
  type ValidationResult,
} from "./types";

type CandidateRequest = Partial<IntakeRequest>;

function hasValue<T extends readonly string[]>(
  values: T,
  candidate: unknown,
): candidate is T[number] {
  return typeof candidate === "string" && values.includes(candidate);
}

function error(field: RequestField, message: string): ValidationError {
  return { field, message };
}

export function validateRequest(candidate: CandidateRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const id = candidate.id?.trim() ?? "";
  const company = candidate.company?.trim() ?? "";
  const scope = candidate.scope?.trim() ?? "";
  const context = candidate.context?.trim();
  const intent = hasValue(intakeIntents, candidate.intent)
    ? candidate.intent
    : null;
  const dataSensitivity = hasValue(
    dataSensitivities,
    candidate.dataSensitivity,
  )
    ? candidate.dataSensitivity
    : null;

  if (id.length < 3) {
    errors.push(error("id", "Request ID must contain at least three characters."));
  }

  if (company.length < 2) {
    errors.push(
      error("company", "Company must contain at least two visible characters."),
    );
  }

  if (!intent) {
    errors.push(error("intent", "Intent must be explore, evaluate, or implement."));
  }

  if (!dataSensitivity) {
    errors.push(
      error("dataSensitivity", "Data sensitivity must be standard or restricted."),
    );
  }

  if (candidate.consent !== true) {
    errors.push(
      error("consent", "Consent is required before a request can be evaluated."),
    );
  }

  if (scope.length < 12) {
    errors.push(
      error("scope", "Scope must contain at least twelve visible characters."),
    );
  }

  if (context !== undefined && context.length > 280) {
    errors.push(
      error("context", "Context must contain no more than 280 characters."),
    );
  }

  if (errors.length > 0 || !intent || !dataSensitivity) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      id,
      company,
      intent,
      dataSensitivity,
      consent: true,
      scope,
      ...(context ? { context } : {}),
    },
  };
}
~~~~

~~~~ts
// packages/core/src/index.ts
export * from "./types";
export * from "./validation";
~~~~

- [ ] **Step 4: Run the focused test and typecheck.**

Run: npm run test -- packages/core/src/validation.test.ts  
Run: npm run typecheck  
Expected: all tests pass and typecheck exits 0.

- [ ] **Step 5: Commit the isolated core validation deliverable.**

~~~~powershell
git add packages/core/src
git commit -m "feat: validate synthetic intake requests"
~~~~

### Task 3: Add deterministic policies, review transitions, and immutable audit events

**Files:**

- Create: packages/core/src/policy.ts
- Create: packages/core/src/policy.test.ts
- Create: packages/core/src/workflow.ts
- Create: packages/core/src/workflow.test.ts
- Modify: packages/core/src/types.ts
- Modify: packages/core/src/index.ts

**Interfaces:**

- Consumes a valid IntakeRequest.
- Produces evaluateRequest(request), createWorkflow(request, timestamp), evaluateWorkflow(workflow, timestamp), and transitionReview(workflow, action, timestamp).
- Defines ReviewStatus as new, evaluated, needs_review, approved, context_requested, or rejected.

- [ ] **Step 1: Write failing policy and workflow tests.**

~~~~ts
// packages/core/src/policy.test.ts
import { evaluateRequest } from "./policy";
import type { IntakeRequest } from "./types";

const request: IntakeRequest = {
  id: "req-boreal",
  company: "Boreal Systems",
  intent: "implement",
  dataSensitivity: "standard",
  consent: true,
  scope: "Assess a reviewable workflow before implementation begins.",
};

describe("evaluateRequest", () => {
  it("derives review from an implementation request and explains the result", () => {
    expect(evaluateRequest(request)).toEqual({
      recommendation: "review",
      results: [
        {
          policyId: "restricted-data",
          outcome: "allow",
          explanation: "The request does not declare restricted data.",
        },
        {
          policyId: "implementation-scope",
          outcome: "review",
          explanation: "Implementation requests require human review.",
        },
        {
          policyId: "context-present",
          outcome: "review",
          explanation: "Additional context is required before follow-up.",
        },
      ],
    });
  });
});
~~~~

~~~~ts
// packages/core/src/workflow.test.ts
import {
  createWorkflow,
  evaluateWorkflow,
  transitionReview,
} from "./workflow";
import type { IntakeRequest } from "./types";

const request: IntakeRequest = {
  id: "req-cascade",
  company: "Cascade Studio",
  intent: "evaluate",
  dataSensitivity: "standard",
  consent: true,
  scope: "Evaluate a deterministic workflow with a reviewable recommendation.",
  context: "A small team wants a local reference implementation.",
};

describe("workflow", () => {
  it("records evaluation then a valid human approval as immutable events", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const evaluated = evaluateWorkflow(created, "2026-08-07T09:01:00.000Z");
    const approved = transitionReview(
      evaluated,
      "approve",
      "2026-08-07T09:02:00.000Z",
    );

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      throw new Error("Expected approval to succeed.");
    }

    expect(approved.value.status).toBe("approved");
    expect(approved.value.events).toHaveLength(3);
    expect(Object.isFrozen(approved.value.events)).toBe(true);
    expect(Object.isFrozen(approved.value.events[2])).toBe(true);
  });

  it("rejects a review action before evaluation without mutating the workflow", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const result = transitionReview(
      created,
      "reject",
      "2026-08-07T09:01:00.000Z",
    );

    expect(result).toEqual({
      ok: false,
      error: "A request must be evaluated before it can be reviewed.",
      value: created,
    });
  });
});
~~~~

- [ ] **Step 2: Run both tests and confirm they fail because policy and workflow modules are absent.**

Run: npm run test -- packages/core/src/policy.test.ts packages/core/src/workflow.test.ts  
Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement the deterministic rule engine and workflow reducer.**

~~~~ts
// Append to packages/core/src/types.ts
export type PolicyOutcome = "allow" | "review" | "block";

export interface PolicyResult {
  readonly policyId: string;
  readonly outcome: PolicyOutcome;
  readonly explanation: string;
}

export interface Evaluation {
  readonly recommendation: PolicyOutcome;
  readonly results: readonly PolicyResult[];
}

export type ReviewStatus =
  | "new"
  | "evaluated"
  | "needs_review"
  | "approved"
  | "context_requested"
  | "rejected";

export type ReviewAction = "approve" | "request_context" | "reject";

export type AuditActor = "system" | "reviewer";

export type AuditEventType =
  | "request_created"
  | "request_evaluated"
  | "request_approved"
  | "context_requested"
  | "request_rejected";

export interface AuditEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly actor: AuditActor;
  readonly type: AuditEventType;
  readonly summary: string;
}

export interface WorkflowRecord {
  readonly request: IntakeRequest;
  readonly status: ReviewStatus;
  readonly evaluation?: Evaluation;
  readonly events: readonly AuditEvent[];
}

export type TransitionResult =
  | { readonly ok: true; readonly value: WorkflowRecord }
  | { readonly ok: false; readonly error: string; readonly value: WorkflowRecord };
~~~~

~~~~ts
// packages/core/src/policy.ts
import type {
  Evaluation,
  IntakeRequest,
  PolicyOutcome,
  PolicyResult,
} from "./types";

function highestOutcome(results: readonly PolicyResult[]): PolicyOutcome {
  if (results.some((result) => result.outcome === "block")) {
    return "block";
  }

  if (results.some((result) => result.outcome === "review")) {
    return "review";
  }

  return "allow";
}

export function evaluateRequest(request: IntakeRequest): Evaluation {
  const results: PolicyResult[] = [
    request.dataSensitivity === "restricted"
      ? {
          policyId: "restricted-data",
          outcome: "block",
          explanation:
            "Requests declaring restricted data are outside this local demo.",
        }
      : {
          policyId: "restricted-data",
          outcome: "allow",
          explanation: "The request does not declare restricted data.",
        },
    request.intent === "implement"
      ? {
          policyId: "implementation-scope",
          outcome: "review",
          explanation: "Implementation requests require human review.",
        }
      : {
          policyId: "implementation-scope",
          outcome: "allow",
          explanation: "The request scope can be considered locally.",
        },
    request.context?.trim()
      ? {
          policyId: "context-present",
          outcome: "allow",
          explanation: "The request includes enough context for follow-up.",
        }
      : {
          policyId: "context-present",
          outcome: "review",
          explanation: "Additional context is required before follow-up.",
        },
  ];

  return Object.freeze({
    recommendation: highestOutcome(results),
    results: Object.freeze(results.map((result) => Object.freeze(result))),
  });
}
~~~~

~~~~ts
// packages/core/src/workflow.ts
import { evaluateRequest } from "./policy";
import type {
  AuditEvent,
  AuditEventType,
  IntakeRequest,
  PolicyOutcome,
  ReviewAction,
  ReviewStatus,
  TransitionResult,
  WorkflowRecord,
} from "./types";

function freezeEvent(event: AuditEvent): AuditEvent {
  return Object.freeze(event);
}

function appendEvent(
  events: readonly AuditEvent[],
  event: AuditEvent,
): readonly AuditEvent[] {
  return Object.freeze([...events, freezeEvent(event)]);
}

function event(
  id: string,
  occurredAt: string,
  type: AuditEventType,
  summary: string,
  actor: AuditEvent["actor"],
): AuditEvent {
  return freezeEvent({ id, occurredAt, type, summary, actor });
}

function evaluationStatus(
  status: ReviewStatus,
  recommendation: PolicyOutcome,
): ReviewStatus {
  if (status !== "new") {
    return status;
  }

  return recommendation === "allow" ? "evaluated" : "needs_review";
}

export function createWorkflow(
  request: IntakeRequest,
  occurredAt: string,
): WorkflowRecord {
  return Object.freeze({
    request,
    status: "new",
    events: appendEvent(
      [],
      event(
        request.id + "-created",
        occurredAt,
        "request_created",
        "Synthetic request created.",
        "system",
      ),
    ),
  });
}

export function evaluateWorkflow(
  workflow: WorkflowRecord,
  occurredAt: string,
): WorkflowRecord {
  const evaluation = evaluateRequest(workflow.request);
  const status = evaluationStatus(workflow.status, evaluation.recommendation);

  return Object.freeze({
    ...workflow,
    status,
    evaluation,
    events: appendEvent(
      workflow.events,
      event(
        workflow.request.id + "-evaluated",
        occurredAt,
        "request_evaluated",
        "Deterministic policy evaluation completed.",
        "system",
      ),
    ),
  });
}

const actionDetails: Record<
  ReviewAction,
  { readonly status: ReviewStatus; readonly type: AuditEventType; readonly summary: string }
> = {
  approve: {
    status: "approved",
    type: "request_approved",
    summary: "Human reviewer approved the request.",
  },
  request_context: {
    status: "context_requested",
    type: "context_requested",
    summary: "Human reviewer requested additional context.",
  },
  reject: {
    status: "rejected",
    type: "request_rejected",
    summary: "Human reviewer rejected the request.",
  },
};

export function transitionReview(
  workflow: WorkflowRecord,
  action: ReviewAction,
  occurredAt: string,
): TransitionResult {
  if (workflow.status === "new") {
    return {
      ok: false,
      error: "A request must be evaluated before it can be reviewed.",
      value: workflow,
    };
  }

  if (
    workflow.status === "approved" ||
    workflow.status === "context_requested" ||
    workflow.status === "rejected"
  ) {
    return {
      ok: false,
      error: "A completed review cannot be changed in this demo.",
      value: workflow,
    };
  }

  const detail = actionDetails[action];

  return {
    ok: true,
    value: Object.freeze({
      ...workflow,
      status: detail.status,
      events: appendEvent(
        workflow.events,
        event(
          workflow.request.id + "-" + detail.type,
          occurredAt,
          detail.type,
          detail.summary,
          "reviewer",
        ),
      ),
    }),
  };
}
~~~~

~~~~ts
// Replace packages/core/src/index.ts
export * from "./types";
export * from "./validation";
export * from "./policy";
export * from "./workflow";
~~~~

- [ ] **Step 4: Run core tests, inspect transition coverage, and commit.**

Run: npm run test -- packages/core/src/policy.test.ts packages/core/src/workflow.test.ts  
Run: npm run typecheck  
Expected: PASS with policy explanations, valid transitions, and blocked invalid transitions.

~~~~powershell
git add packages/core/src
git commit -m "feat: add deterministic review workflow core"
~~~~

### Task 4: Add six synthetic fixtures and guarded local persistence

**Files:**

- Create: packages/fixtures/src/index.ts
- Create: packages/fixtures/src/index.test.ts
- Create: apps/demo/src/lib/localSnapshot.ts
- Create: apps/demo/src/lib/localSnapshot.test.ts

**Interfaces:**

- Produces createDemoRecords() with exactly six evaluated synthetic WorkflowRecord values.
- Produces loadSnapshot(storage), saveSnapshot(storage, snapshot), and clearSnapshot(storage).
- Uses only the key reviewable-intake-workbench.snapshot.v1.

- [ ] **Step 1: Write failing persistence and fixture tests.**

~~~~ts
// apps/demo/src/lib/localSnapshot.test.ts
import { clearSnapshot, loadSnapshot, saveSnapshot } from "./localSnapshot";

const storageKey = "reviewable-intake-workbench.snapshot.v1";

describe("localSnapshot", () => {
  it("returns null for corrupt local data instead of throwing", () => {
    const storage = {
      getItem: () => "{not-json",
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSnapshot(storage)).toBeNull();
  });

  it("reports a persistence failure while keeping the caller in control", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota unavailable");
      },
      removeItem: () => undefined,
    };

    expect(saveSnapshot(storage, { selectedId: "req-aurora", records: [] })).toEqual({
      ok: false,
      error: "Local persistence is unavailable. This session remains usable.",
    });
  });

  it("clears only the workbench snapshot key", () => {
    const removed: string[] = [];
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: (key: string) => removed.push(key),
    };

    clearSnapshot(storage);

    expect(removed).toEqual([storageKey]);
  });
});
~~~~

~~~~ts
// packages/fixtures/src/index.test.ts
import { createDemoRecords } from "./index";

describe("createDemoRecords", () => {
  it("creates exactly six synthetic records", () => {
    expect(createDemoRecords()).toHaveLength(6);
  });
});
~~~~

- [ ] **Step 2: Run the tests and confirm they fail because fixtures and persistence are absent.**

Run: npm run test -- apps/demo/src/lib/localSnapshot.test.ts packages/fixtures/src/index.test.ts  
Expected: FAIL with missing module errors.

- [ ] **Step 3: Add clearly synthetic fixtures and the local-only adapter.**

~~~~ts
// packages/fixtures/src/index.ts
import {
  createWorkflow,
  evaluateWorkflow,
  type IntakeRequest,
  type WorkflowRecord,
} from "@reviewable-intake/core";

const requests: readonly IntakeRequest[] = [
  {
    id: "req-aurora",
    company: "Aurora Fieldworks",
    intent: "explore",
    dataSensitivity: "standard",
    consent: true,
    scope: "Explore a local workbench for transparent intake review.",
    context: "The team wants a short demonstration with no external services.",
  },
  {
    id: "req-boreal",
    company: "Boreal Systems",
    intent: "implement",
    dataSensitivity: "standard",
    consent: true,
    scope: "Assess a reviewable workflow before implementation begins.",
  },
  {
    id: "req-cascade",
    company: "Cascade Studio",
    intent: "evaluate",
    dataSensitivity: "standard",
    consent: true,
    scope: "Evaluate a deterministic workflow with a reviewable recommendation.",
    context: "A small team wants a local reference implementation.",
  },
  {
    id: "req-drift",
    company: "Drift Workshop",
    intent: "explore",
    dataSensitivity: "restricted",
    consent: true,
    scope: "Explore a request that declares information outside the demo boundary.",
    context: "The demo must explain why this request cannot proceed automatically.",
  },
  {
    id: "req-ember",
    company: "Ember Ledger",
    intent: "evaluate",
    dataSensitivity: "standard",
    consent: true,
    scope: "Evaluate a compact deterministic policy system for internal review.",
    context: "The request includes enough detail for a direct human decision.",
  },
  {
    id: "req-fjord",
    company: "Fjord Assembly",
    intent: "implement",
    dataSensitivity: "standard",
    consent: true,
    scope: "Review a proposal for a staged workflow implementation.",
    context: "The team needs explicit ownership before any implementation work.",
  },
];

export function createDemoRecords(): readonly WorkflowRecord[] {
  return Object.freeze(
    requests.map((request, index) => {
      const createdAt = "2026-08-07T09:0" + index + ":00.000Z";
      const evaluatedAt = "2026-08-07T09:1" + index + ":00.000Z";

      return evaluateWorkflow(createWorkflow(request, createdAt), evaluatedAt);
    }),
  );
}
~~~~

~~~~ts
// apps/demo/src/lib/localSnapshot.ts
import type { WorkflowRecord } from "@reviewable-intake/core";

export const snapshotKey = "reviewable-intake-workbench.snapshot.v1";

export interface DemoSnapshot {
  readonly selectedId: string;
  readonly records: readonly WorkflowRecord[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type PersistenceResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return candidate !== null && typeof candidate === "object";
}

function isSnapshot(candidate: unknown): candidate is DemoSnapshot {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
    typeof candidate.selectedId === "string" &&
    Array.isArray(candidate.records)
  );
}

export function loadSnapshot(storage: StorageLike): DemoSnapshot | null {
  try {
    const raw = storage.getItem(snapshotKey);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(
  storage: StorageLike,
  snapshot: DemoSnapshot,
): PersistenceResult {
  try {
    storage.setItem(snapshotKey, JSON.stringify(snapshot));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Local persistence is unavailable. This session remains usable.",
    };
  }
}

export function clearSnapshot(storage: StorageLike): void {
  storage.removeItem(snapshotKey);
}
~~~~

- [ ] **Step 4: Run focused tests and verify no fixtures contain contact channels.**

Run: npm run test -- apps/demo/src/lib/localSnapshot.test.ts packages/fixtures/src/index.test.ts  
Run: rg -n -i "(@|phone|telephone|whatsapp|https?://)" packages/fixtures apps/demo/src  
Expected: tests PASS and ripgrep emits no fixture or UI contact data.

- [ ] **Step 5: Commit fixtures and persistence without adding external dependencies.**

~~~~powershell
git add packages/fixtures apps/demo/src/lib
git commit -m "feat: add synthetic fixtures and local persistence"
~~~~

### Task 5: Orchestrate demo state through a focused React hook

**Files:**

- Create: apps/demo/src/hooks/useDemoWorkflow.ts
- Create: apps/demo/src/hooks/useDemoWorkflow.test.tsx

**Interfaces:**

- Consumes createDemoRecords, transitionReview, and the StorageLike adapter.
- Produces records, selectedRecord, selectRequest, review, reset, and persistenceMessage.
- Never throws on unavailable localStorage.

- [ ] **Step 1: Write a failing hook test that proves review and reset are stateful.**

~~~~tsx
// apps/demo/src/hooks/useDemoWorkflow.test.tsx
import { act, renderHook } from "@testing-library/react";
import { useDemoWorkflow } from "./useDemoWorkflow";

describe("useDemoWorkflow", () => {
  it("approves a selected request and restores fixtures on reset", () => {
    const { result } = renderHook(() => useDemoWorkflow());
    const firstId = result.current.records[0].request.id;

    act(() => {
      result.current.selectRequest(firstId);
      result.current.review("approve");
    });

    expect(result.current.selectedRecord?.status).toBe("approved");

    act(() => {
      result.current.reset();
    });

    expect(result.current.records).toHaveLength(6);
    expect(result.current.records[0].status).not.toBe("approved");
  });
});
~~~~

- [ ] **Step 2: Run the test and confirm it fails because the hook is absent.**

Run: npm run test -- apps/demo/src/hooks/useDemoWorkflow.test.tsx  
Expected: FAIL with a missing hook module error.

- [ ] **Step 3: Implement state initialization, review, persistence, and reset.**

~~~~tsx
// apps/demo/src/hooks/useDemoWorkflow.ts
import { useMemo, useState } from "react";
import {
  transitionReview,
  type ReviewAction,
} from "@reviewable-intake/core";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
  type DemoSnapshot,
  type StorageLike,
} from "../lib/localSnapshot";

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function initialSnapshot(storage: StorageLike | null): DemoSnapshot {
  const persisted = storage ? loadSnapshot(storage) : null;

  if (persisted && persisted.records.length === 6) {
    return persisted;
  }

  const records = createDemoRecords();
  return {
    records,
    selectedId: records[0].request.id,
  };
}

export function useDemoWorkflow() {
  const storage = useMemo(browserStorage, []);
  const [snapshot, setSnapshot] = useState(() => initialSnapshot(storage));
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(
    null,
  );

  const selectedRecord =
    snapshot.records.find((record) => record.request.id === snapshot.selectedId) ??
    snapshot.records[0] ??
    null;

  function persist(nextSnapshot: DemoSnapshot): void {
    if (!storage) {
      return;
    }

    const result = saveSnapshot(storage, nextSnapshot);
    setPersistenceMessage(result.ok ? null : result.error);
  }

  function selectRequest(id: string): void {
    const nextSnapshot = { ...snapshot, selectedId: id };
    setSnapshot(nextSnapshot);
    persist(nextSnapshot);
  }

  function review(action: ReviewAction): void {
    if (!selectedRecord) {
      return;
    }

    const result = transitionReview(
      selectedRecord,
      action,
      new Date().toISOString(),
    );

    if (!result.ok) {
      setPersistenceMessage(result.error);
      return;
    }

    const nextSnapshot = {
      ...snapshot,
      records: snapshot.records.map((record) =>
        record.request.id === result.value.request.id ? result.value : record,
      ),
    };

    setSnapshot(nextSnapshot);
    persist(nextSnapshot);
  }

  function reset(): void {
    if (storage) {
      clearSnapshot(storage);
    }

    const records = createDemoRecords();
    setPersistenceMessage(null);
    setSnapshot({ records, selectedId: records[0].request.id });
  }

  return {
    records: snapshot.records,
    selectedRecord,
    persistenceMessage,
    selectRequest,
    review,
    reset,
  };
}
~~~~

- [ ] **Step 4: Run the hook test, then broaden core and hook coverage.**

Run: npm run test -- apps/demo/src/hooks/useDemoWorkflow.test.tsx packages/core/src  
Expected: PASS.

- [ ] **Step 5: Commit the application orchestration boundary.**

~~~~powershell
git add apps/demo/src/hooks
git commit -m "feat: orchestrate local review workflow"
~~~~

### Task 6: Build the accessible review workbench interface

**Files:**

- Create: apps/demo/src/components/RequestQueue.tsx
- Create: apps/demo/src/components/RequestDetail.tsx
- Create: apps/demo/src/components/PolicyResults.tsx
- Create: apps/demo/src/components/ReviewActions.tsx
- Create: apps/demo/src/components/AuditTimeline.tsx
- Modify: apps/demo/src/App.tsx
- Modify: apps/demo/src/App.test.tsx
- Modify: apps/demo/src/styles.css

**Interfaces:**

- RequestQueue receives records, selected ID, and an ID-selection callback.
- RequestDetail receives one WorkflowRecord.
- ReviewActions receives status and the typed review callback.
- App owns no policy logic; it consumes useDemoWorkflow.

- [ ] **Step 1: Extend the app test with a failing user-facing workflow assertion.**

~~~~tsx
// Add this import to apps/demo/src/App.test.tsx
import userEvent from "@testing-library/user-event";

// Add this test to apps/demo/src/App.test.tsx
it("shows the selected request explanation and human review actions", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(
    screen.getByRole("button", { name: /Aurora Fieldworks/i }),
  );

  expect(
    screen.getByRole("heading", { name: "Aurora Fieldworks" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Policy results" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Request context" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
});
~~~~

- [ ] **Step 2: Run the test and confirm it fails because the shell has no workflow UI.**

Run: npm run test -- apps/demo/src/App.test.tsx  
Expected: FAIL because queue, policy results, and review actions are absent.

- [ ] **Step 3: Implement focused components and connect them through App.**

~~~~tsx
// apps/demo/src/components/RequestQueue.tsx
import type { WorkflowRecord } from "@reviewable-intake/core";

interface RequestQueueProps {
  readonly records: readonly WorkflowRecord[];
  readonly selectedId: string | undefined;
  readonly onSelect: (id: string) => void;
}

export function RequestQueue({
  records,
  selectedId,
  onSelect,
}: RequestQueueProps) {
  return (
    <nav aria-label="Synthetic request queue" className="request-queue">
      <h2>Request queue</h2>
      <ul>
        {records.map((record) => (
          <li key={record.request.id}>
            <button
              aria-current={record.request.id === selectedId ? "true" : undefined}
              className="queue-item"
              onClick={() => onSelect(record.request.id)}
              type="button"
            >
              <strong>{record.request.company}</strong>
              <span>{record.status.replaceAll("_", " ")}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
~~~~

~~~~tsx
// apps/demo/src/components/RequestDetail.tsx
import type { WorkflowRecord } from "@reviewable-intake/core";

export function RequestDetail({ record }: { readonly record: WorkflowRecord }) {
  return (
    <section aria-labelledby="request-detail-heading" className="request-detail">
      <p className="eyebrow">Synthetic request</p>
      <h2 id="request-detail-heading">{record.request.company}</h2>
      <dl>
        <div>
          <dt>Intent</dt>
          <dd>{record.request.intent}</dd>
        </div>
        <div>
          <dt>Declared sensitivity</dt>
          <dd>{record.request.dataSensitivity}</dd>
        </div>
        <div>
          <dt>Consent</dt>
          <dd>{record.request.consent ? "Confirmed" : "Missing"}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{record.request.scope}</dd>
        </div>
        {record.request.context ? (
          <div>
            <dt>Context</dt>
            <dd>{record.request.context}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
~~~~

~~~~tsx
// apps/demo/src/components/PolicyResults.tsx
import type { Evaluation } from "@reviewable-intake/core";

export function PolicyResults({
  evaluation,
}: {
  readonly evaluation: Evaluation | undefined;
}) {
  if (!evaluation) {
    return (
      <section aria-labelledby="policy-results-heading">
        <h2 id="policy-results-heading">Policy results</h2>
        <p>The selected request has not been evaluated.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="policy-results-heading">
      <h2 id="policy-results-heading">Policy results</h2>
      <p>
        Recommendation: <strong>{evaluation.recommendation}</strong>
      </p>
      <ul className="policy-results">
        {evaluation.results.map((result) => (
          <li key={result.policyId}>
            <strong>{result.outcome}</strong>
            <span>{result.explanation}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
~~~~

~~~~tsx
// apps/demo/src/components/ReviewActions.tsx
import type { ReviewAction, ReviewStatus } from "@reviewable-intake/core";

interface ReviewActionsProps {
  readonly status: ReviewStatus;
  readonly onReview: (action: ReviewAction) => void;
}

export function ReviewActions({ status, onReview }: ReviewActionsProps) {
  const completed = [
    "approved",
    "context_requested",
    "rejected",
  ].includes(status);

  return (
    <section aria-labelledby="review-actions-heading">
      <h2 id="review-actions-heading">Human review</h2>
      <p>
        A deterministic recommendation never replaces the reviewer&apos;s decision.
      </p>
      <div className="review-actions">
        <button
          disabled={completed}
          onClick={() => onReview("approve")}
          type="button"
        >
          Approve
        </button>
        <button
          disabled={completed}
          onClick={() => onReview("request_context")}
          type="button"
        >
          Request context
        </button>
        <button
          disabled={completed}
          onClick={() => onReview("reject")}
          type="button"
        >
          Reject
        </button>
      </div>
    </section>
  );
}
~~~~

~~~~tsx
// apps/demo/src/components/AuditTimeline.tsx
import type { AuditEvent } from "@reviewable-intake/core";

export function AuditTimeline({ events }: { readonly events: readonly AuditEvent[] }) {
  return (
    <section aria-labelledby="audit-timeline-heading">
      <h2 id="audit-timeline-heading">Audit timeline</h2>
      <ol className="audit-timeline">
        {events.map((event) => (
          <li key={event.id}>
            <time dateTime={event.occurredAt}>
              {new Date(event.occurredAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              })}
            </time>
            <strong>{event.actor}</strong>
            <span>{event.summary}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
~~~~

~~~~tsx
// Replace apps/demo/src/App.tsx
import { AuditTimeline } from "./components/AuditTimeline";
import { PolicyResults } from "./components/PolicyResults";
import { RequestDetail } from "./components/RequestDetail";
import { RequestQueue } from "./components/RequestQueue";
import { ReviewActions } from "./components/ReviewActions";
import { useDemoWorkflow } from "./hooks/useDemoWorkflow";

export default function App() {
  const {
    records,
    selectedRecord,
    persistenceMessage,
    selectRequest,
    review,
    reset,
  } = useDemoWorkflow();

  if (!selectedRecord) {
    return (
      <main className="app-shell">
        <h1>Reviewable Intake Workbench</h1>
        <p>No synthetic requests are available.</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-only reference implementation</p>
          <h1>Reviewable Intake Workbench</h1>
          <p>
            All records are fictional. Recommendations are deterministic and
            require human review.
          </p>
        </div>
        <button onClick={reset} type="button">
          Reset demo data
        </button>
      </header>

      {persistenceMessage ? (
        <p aria-live="polite" className="feedback-message">
          {persistenceMessage}
        </p>
      ) : null}

      <div className="workbench-layout">
        <RequestQueue
          records={records}
          selectedId={selectedRecord.request.id}
          onSelect={selectRequest}
        />
        <div className="detail-column">
          <RequestDetail record={selectedRecord} />
          <PolicyResults evaluation={selectedRecord.evaluation} />
          <ReviewActions status={selectedRecord.status} onReview={review} />
          <AuditTimeline events={selectedRecord.events} />
        </div>
      </div>
    </main>
  );
}
~~~~

~~~~css
/* Append to apps/demo/src/styles.css */
.app-header,
.workbench-layout,
.detail-column,
.review-actions,
.request-queue ul,
.policy-results,
.audit-timeline {
  display: grid;
  gap: 1rem;
}

.app-header {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  margin-bottom: 2rem;
}

.workbench-layout {
  grid-template-columns: minmax(15rem, 0.7fr) minmax(0, 1.5fr);
  align-items: start;
}

.request-queue,
.detail-column > section,
.feedback-message {
  border: 1px solid #d9e2ec;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 1rem;
}

.request-queue ul,
.policy-results,
.audit-timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.queue-item {
  display: grid;
  width: 100%;
  gap: 0.25rem;
  border: 1px solid #d9e2ec;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 0.75rem;
  text-align: left;
}

.queue-item[aria-current="true"] {
  border-color: #155eef;
  outline: 3px solid #dbeafe;
}

.policy-results li,
.audit-timeline li {
  display: grid;
  gap: 0.25rem;
  border-left: 3px solid #155eef;
  padding-left: 0.75rem;
}

.review-actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

button {
  min-height: 2.75rem;
  border: 1px solid #155eef;
  border-radius: 0.5rem;
  background: #155eef;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}

@media (max-width: 48rem) {
  .app-header,
  .workbench-layout,
  .review-actions {
    grid-template-columns: 1fr;
  }
}
~~~~

- [ ] **Step 4: Run the interaction test, test keyboard focus manually, and commit.**

Run: npm run test -- apps/demo/src/App.test.tsx  
Run: npm run build  
Expected: PASS; the page has one heading, keyboard-operable queue buttons, labelled sections, and no browser console errors.

~~~~powershell
git add apps/demo/src
git commit -m "feat: add accessible intake review workbench"
~~~~

### Task 7: Cover full review behavior, reset, and browser smoke flow

**Files:**

- Modify: apps/demo/src/App.test.tsx
- Create: playwright.config.ts
- Create: e2e/review-workflow.spec.ts
- Modify: package.json

**Interfaces:**

- The visible workflow accepts one review action per evaluated request.
- Reset demo data restores six fresh records and removes the local snapshot key.
- Browser tests run against the Vite demo on a dedicated local port.

- [ ] **Step 1: Add failing UI tests for a review action, disabled completed actions, and reset.**

~~~~tsx
// Add these tests to apps/demo/src/App.test.tsx
it("adds a human audit event and disables further actions after approval", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "Approve" }));

  expect(
    screen.getByText("Human reviewer approved the request."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
});

it("restores the original workflow after reset", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "Approve" }));
  await user.click(screen.getByRole("button", { name: "Reset demo data" }));

  expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  expect(
    screen.queryByText("Human reviewer approved the request."),
  ).not.toBeInTheDocument();
});
~~~~

- [ ] **Step 2: Run the UI tests and confirm they fail before the necessary behavior is complete.**

Run: npm run test -- apps/demo/src/App.test.tsx  
Expected: FAIL on the missing audit result, disabled state, or reset behavior.

- [ ] **Step 3: Complete the smallest missing behavior and add browser configuration.**

Ensure Task 5 and Task 6 implementation satisfies the tests. Then install Playwright:

Run: npm install --save-dev @playwright/test  
Run: npx playwright install chromium

~~~~ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev --workspace @reviewable-intake/demo -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
~~~~

~~~~ts
// e2e/review-workflow.spec.ts
import { expect, test } from "@playwright/test";

test("reviews a synthetic request and resets the local demo", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") {
      externalRequests.push(url.href);
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Reviewable Intake Workbench" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Aurora Fieldworks/i }).click();
  await page.getByRole("button", { name: "Approve" }).click();

  await expect(
    page.getByText("Human reviewer approved the request."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeDisabled();

  await page.getByRole("button", { name: "Reset demo data" }).click();

  await expect(page.getByRole("button", { name: "Approve" })).toBeEnabled();
  await expect(
    page.getByText("Human reviewer approved the request."),
  ).not.toBeVisible();
  expect(externalRequests).toEqual([]);
});
~~~~

- [ ] **Step 4: Run all unit, component, and browser tests.**

Run: npm run test  
Run: npm run test:e2e  
Expected: all tests pass in Chromium; no retries or skipped workflow tests.

- [ ] **Step 5: Commit behavior coverage and browser smoke testing.**

~~~~powershell
git add package.json package-lock.json playwright.config.ts e2e apps/demo/src/App.test.tsx
git commit -m "test: cover review workflow in browser"
~~~~

### Task 8: Add release documentation, CI, provenance safeguards, and final verification

**Files:**

- Create: README.md
- Create: ARCHITECTURE.md
- Create: SECURITY.md
- Create: CONTRIBUTING.md
- Create: PROVENANCE.md
- Create: LICENSE
- Create: docs/data-boundary.md
- Create: docs/extension-guide.md
- Create: scripts/verify-release-docs.mjs
- Create: .github/workflows/ci.yml
- Modify: package.json

**Interfaces:**

- The README makes local setup, validation commands, data boundaries, and project limitations explicit.
- CI runs npm install, lint, typecheck, unit/component tests, build, browser tests, and release-document verification on pull requests and main pushes.
- Release docs make clean-room provenance and non-production scope defensible.

- [ ] **Step 1: Write a failing release-document verifier.**

~~~~js
// scripts/verify-release-docs.mjs
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
  "npm run build",
  "npm run test:e2e",
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
~~~~

Replace the root scripts object with:

~~~~json
"scripts": {
  "dev": "npm run dev --workspace @reviewable-intake/demo",
  "build": "npm run build --workspace @reviewable-intake/demo",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "verify:release-docs": "node scripts/verify-release-docs.mjs"
}
~~~~

- [ ] **Step 2: Run the verification script and confirm it fails because the release files do not exist.**

Run: npm run verify:release-docs  
Expected: FAIL with a missing-file or missing-command error.

- [ ] **Step 3: Add clear English public documentation and a least-privilege CI workflow.**

~~~~~md
<!-- README.md -->
# Reviewable Intake Workbench

A local-only reference implementation for deterministic intake recommendations and human review.

## What it demonstrates

- Typed request validation without contact data
- Deterministic and explainable policy results
- Explicit human review transitions
- Append-only audit events
- Browser-local demo persistence and reset

## Quick start

~~~~text
npm install
npm run dev
~~~~

Open the local URL printed by Vite. The demo contains six fictional records and makes no network request.

## Quality checks

~~~~text
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
~~~~

## Boundaries

This is not a CRM, messaging service, AI agent, or production decision system. It contains no real data, credentials, external integrations, analytics, authentication, or database.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [PROVENANCE.md](PROVENANCE.md), [docs/data-boundary.md](docs/data-boundary.md), and [SECURITY.md](SECURITY.md) before adapting it.
~~~~~

~~~~~md
<!-- ARCHITECTURE.md -->
# Architecture

The repository separates domain policy from the browser demo.

~~~~text
packages/core      validation, policies, workflow transitions, audit events
packages/fixtures  six fictional records
apps/demo          React interface and localStorage adapter
~~~~

The core accepts plain TypeScript data and has no React, browser, storage, or network dependency. The demo is responsible for rendering, selection, local persistence, and reset.

Automatic recommendations are never approvals. The reviewer must choose an allowed transition, and each accepted transition appends a new audit event.
~~~~~

~~~~md
<!-- SECURITY.md -->
# Security Policy

## Scope

The project is local-only and intentionally accepts no credentials or production data.

## Reporting a problem

Open a private security advisory in the repository. Do not include real personal data, secrets, access tokens, or production URLs in an issue.

## Release rule

Before publication, scan the working tree and reachable Git history for credentials, contact identifiers, external URLs, generated assets, and unreviewed metadata.
~~~~

~~~~md
<!-- CONTRIBUTING.md -->
# Contributing

## Before opening a pull request

1. Keep all public text in English.
2. Add only fictional, non-contact fixture data.
3. Do not add network calls, credentials, environment values, analytics, or unreviewed assets.
4. Run lint, typecheck, tests, build, and browser smoke tests.
5. Explain the policy or workflow boundary changed by the pull request.
~~~~

~~~~md
<!-- PROVENANCE.md -->
# Provenance

This repository is a clean-room personal implementation. Its source, fixtures, documentation, tests, design, and assets were authored for this repository.

It does not include copied private-client work, employer work, operational documentation, production schemas, contact data, screenshots, credentials, or Git history from another project.

Dependencies are installed from their public package registries and remain subject to their own licenses.
~~~~

~~~~md
<!-- docs/data-boundary.md -->
# Data Boundary

Every record in this repository is fictional and intentionally excludes email addresses, phone numbers, physical addresses, external URLs, tracking identifiers, credentials, and production-like tokens.

The demo runs in the browser and persists only its fictional workflow snapshot under one localStorage key. Reset removes only that key.

Do not adapt this repository by importing customer records, contact lists, message transcripts, screenshots, operational runbooks, or non-public source material.
~~~~

~~~~md
<!-- docs/extension-guide.md -->
# Extension Guide

## Add a policy

Add a pure rule result in packages/core/src/policy.ts. The rule must return an outcome of allow, review, or block and a readable explanation. Add unit coverage for its ordering and derived recommendation.

## Add persistence

Implement the StorageLike shape used by the demo adapter. Keep persistence outside packages/core, return a typed failure instead of throwing into the user interface, and add a reset test.

## Preserve the boundary

Extensions may not add credentials, automatic outreach, live integrations, or real data to the default demo.
~~~~

~~~~text
// LICENSE
MIT License

Copyright (c) 2026 julismo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
~~~~

~~~~yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check out source
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2

      - name: Set up Node.js
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

      - name: Browser smoke test
        run: npm run test:e2e

      - name: Verify release documents
        run: npm run verify:release-docs
~~~~

- [ ] **Step 4: Run release checks and a redacted safety scan.**

Run: npm run verify:release-docs  
Run: npm run lint  
Run: npm run typecheck  
Run: npm run test  
Run: npm run build  
Run: npm run test:e2e

Run this value-redacted scan and require no output:

~~~~powershell
$patterns = @(
  'ghp_[A-Za-z0-9]+',
  'AIza[0-9A-Za-z_-]+',
  'sk-[A-Za-z0-9_-]+',
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
  '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}',
  '\+?[0-9][0-9 ()\.-]{7,}[0-9]'
)
git grep -n -I -E ($patterns -join '|') -- . ':!package-lock.json'
$revisions = @(git rev-list --all)
git grep -n -I -E ($patterns -join '|') $revisions -- ':!package-lock.json'
~~~~

Expected: all quality commands exit 0 and the scan emits no match. If the scan finds a test literal, replace it with a non-contact synthetic representation rather than suppressing the finding.

- [ ] **Step 5: Commit release controls, then perform a final clean-history check.**

~~~~powershell
git add README.md ARCHITECTURE.md SECURITY.md CONTRIBUTING.md PROVENANCE.md LICENSE docs .github scripts package.json package-lock.json
git commit -m "docs: prepare public release controls"
git log --all --oneline
git status --short
~~~~

Expected: clean working tree; every reachable commit is authored within this clean-room repository.

### Task 9: Publish the verified repository as a personal open-source project

**Files:**

- Modify: remote configuration only after every Task 8 verification passes.
- No source or fixture changes are permitted in this task.

**Interfaces:**

- Produces one public repository named julismo/reviewable-intake-workbench.
- Produces GitHub metadata that describes only the personal open-source workbench.
- Requires a green GitHub Actions run before profile curation considers it for a pin.

- [ ] **Step 1: Verify the name is unused and repeat the final local gates from a clean install.**

Run: gh repo view julismo/reviewable-intake-workbench  
Expected: command exits non-zero because the public repository does not exist yet.

Run: npm ci  
Run: npm run lint  
Run: npm run typecheck  
Run: npm run test  
Run: npm run build  
Run: npm run test:e2e  
Run: npm run verify:release-docs  
Expected: every local quality command exits 0.

- [ ] **Step 2: Create and publish the personal public repository only after the checks pass.**

~~~~powershell
gh repo create julismo/reviewable-intake-workbench --public --source . --remote origin --push --description "A local-only reference workbench for deterministic intake review and human audit trails."
gh repo edit julismo/reviewable-intake-workbench --add-topic typescript --add-topic react --add-topic vite --add-topic workflow --add-topic audit-trail
~~~~

Expected: origin points to julismo/reviewable-intake-workbench, main is public, and no company, client, or external-service branding appears in the repository metadata.

- [ ] **Step 3: Enable dependency security controls and verify public state without exposing credentials.**

~~~~powershell
gh api --method PUT repos/julismo/reviewable-intake-workbench/vulnerability-alerts
gh api --method PUT repos/julismo/reviewable-intake-workbench/automated-security-fixes
gh repo view julismo/reviewable-intake-workbench --json visibility,description,repositoryTopics,url
~~~~

Expected: visibility is PUBLIC; description and topics match the personal project; vulnerability alerts and automated security fixes accept the request or return an already-enabled state.

- [ ] **Step 4: Wait for the initial CI run and verify the published tree and history.**

~~~~powershell
gh run list --repo julismo/reviewable-intake-workbench --limit 1
gh run watch --repo julismo/reviewable-intake-workbench --exit-status
git ls-remote --heads origin main
git log --all --oneline
~~~~

Expected: CI completes successfully, origin/main points to the verified local commit, and all reachable commits belong to this clean-room history.

- [ ] **Step 5: Record the release evidence in the project README or release notes without adding inflated claims.**

Add only verified facts: the local-only boundary, deterministic policy engine, human review, six synthetic records, test commands, and the public CI result. Do not add activity widgets, skill lists, client references, usage claims, AI marketing language, or employer/company attribution.

## Final Verification Checklist

- [ ] npm ci succeeds from a clean node_modules directory.
- [ ] npm run lint exits 0.
- [ ] npm run typecheck exits 0.
- [ ] npm run test exits 0.
- [ ] npm run build exits 0.
- [ ] npm run test:e2e exits 0.
- [ ] npm run verify:release-docs exits 0.
- [ ] The application makes no browser network request after initial page load.
- [ ] The rendered UI contains only six fictional records and no contact details.
- [ ] The current tree and every reachable commit pass the value-redacted secret and PII scan.
- [ ] MIT, security, contribution, data-boundary, architecture, extension, and provenance documentation are present and linked from the README.
- [ ] The public GitHub repository has a green initial CI run, personal metadata, and no company or client presentation.
