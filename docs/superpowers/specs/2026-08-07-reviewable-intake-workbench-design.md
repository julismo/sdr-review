# Reviewable Intake Workbench Design

**Status:** Implemented and locally verified; public publication awaits final release checks
**Repository language:** English  
**License:** MIT

## Purpose

Reviewable Intake Workbench is a personal, open-source reference implementation for handling synthetic B2B demo requests. It demonstrates a small, usable policy engine and a review workflow that makes every decision visible and reversible by a human reviewer.

The repository is a clean-room project with a new Git history. It must contain no non-public source code, business terminology, assets, contacts, identifiers, credentials, screenshots, or data.

## Goals

- Provide a reusable TypeScript core for request validation, deterministic policy evaluation, review-state transitions, and append-only audit events.
- Provide a polished local web demo that lets a reviewer inspect and act on synthetic requests.
- Make every automatic outcome explainable through plain-language rule results.
- Run fully locally without network access, accounts, API keys, authentication, a database, analytics, or an AI model.
- Be easy to evaluate in one minute and rich enough to discuss in a technical interview.

## Non-goals

- Building a production CRM, messaging system, scheduling product, or autonomous agent.
- Including a language-model integration, a real channel adapter, or live delivery.
- Storing real contact, health, financial, customer, employee, or company data.
- Reusing code, schema shapes, copy, visuals, fixtures, prompts, or Git history from non-public work.

## Repository Shape

```text
ARCHITECTURE.md          System boundaries and data flow
apps/
  demo/                 React application, UI state, and browser-local persistence
packages/
  core/                 Framework-independent validation, policy, workflow, and audit behavior
  fixtures/             Explicitly synthetic scenarios used by the demo and tests
docs/
  extension-guide.md    How to add a policy or persistence adapter
  data-boundary.md      Synthetic-data and privacy guarantees
  superpowers/specs/    Approved design and implementation plans
```

The repository uses npm workspaces, TypeScript, React, Vite, Vitest, Testing Library, Playwright, ESLint, and GitHub Actions. Node.js 24 is the supported local and CI runtime.

`packages/core` remains independent of browser APIs and persistence. `apps/demo` owns the browser-facing `StorageLike` boundary, the `localStorage` adapter, and the logic for loading, saving, clearing, and restoring demo snapshots. The `docs/` directory contains the data boundary, extension guide, and project planning records.

## Domain Model

`packages/core` owns the following framework-independent concepts:

- `IntakeRequest`: a synthetic request with a stable identifier, company label, request intent, consent flag, requested scope, and optional context.
- `Policy`: a named deterministic predicate with a readable explanation and an outcome of `allow`, `review`, or `block`.
- `Evaluation`: the ordered policy results plus the derived recommendation.
- `ReviewStatus`: `new`, `evaluated`, `needs_review`, `approved`, `context_requested`, or `rejected`.
- `AuditEvent`: an immutable event with an event identifier, timestamp, actor type, event type, and payload summary.

The core publicly exports `validateRequest`, `evaluateRequest`, `createWorkflow`, `evaluateWorkflow`, and `transitionReview`. It appends immutable audit events internally as workflows are created, evaluated, and transitioned; there is no standalone public `appendAuditEvent` API. These functions accept plain data and return typed results; the core does not import React, browser APIs, environment variables, or network clients.

## Workflow

```text
Synthetic fixture
  -> schema validation
  -> deterministic policy evaluation
  -> explained recommendation
  -> human review action
  -> validated state transition
  -> append-only audit event
  -> locally persisted demo snapshot
```

The demo begins with six fictional requests. A reviewer can select one, inspect its data and policy results, then approve it, request context, or reject it. The UI prevents impossible transitions and presents an actionable explanation when an action is unavailable. `Reset demo data` clears local state and restores the original six fixtures.

## Demo Experience

The single-page application contains:

- A keyboard-accessible request queue with a status, recommendation, and concise summary for each synthetic request.
- A request-detail view with clearly labelled fields and synthetic-data notice.
- A policy-results section that explains why the recommendation was produced.
- Review actions: **Approve**, **Request context**, and **Reject**.
- A chronological audit timeline showing creation, evaluation, and human-review events.
- Empty, unavailable-action, local-persistence, and reset states.

The product does not imitate a chatbot or imply autonomous decision-making. The interface states that recommendations are deterministic and that a human remains responsible for review.

## Synthetic Data and Security Boundary

- Fixtures use invented organisations and people, reserved identifiers, and no email address, phone number, address, external URL, tracking value, or production-like token.
- The project performs no outbound browser requests.
- No `.env` file is required. If an environment example is ever added, every value must be an empty or clearly non-secret placeholder.
- Dependencies, icons, fonts, and any future assets must have documented compatible licenses.
- The release process includes a secret/PII scan of both the working tree and reachable Git history, followed by a manual review of rendered Markdown and browser-visible text.

## Error Handling

- Invalid input is rejected before policy evaluation and returned as field-level errors by the core. The v0.1 demo uses reviewed fixtures rather than a free-text intake form.
- Policies are fixed, code-owned definitions in v0.1; the public core accepts no runtime policy configuration that could become an automatic approval.
- Invalid review transitions return a typed error and leave the existing snapshot unchanged.
- Failed local persistence leaves the current in-memory session usable and shows a non-blocking explanation.
- Reset is explicit; it never deletes data outside the demo's own local-storage key.

## Quality and Release Requirements

- Unit tests cover validation, policy ordering, recommendation derivation, allowed and forbidden transitions, audit-event immutability, and persistence failure handling.
- Component tests cover queue selection, policy explanations, review actions, validation messages, persistence restoration, and reset.
- A browser smoke test covers a complete synthetic request review and reset.
- GitHub Actions runs `npm ci`, lint, typecheck, unit/component tests, and production build on every pull request and main-branch push.
- The repository includes `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, an English data-boundary document, and a short provenance statement.

## Definition of Done for v0.1

v0.1 is ready to publish when a new contributor can clone the repository, run the demo locally, understand a decision and its audit trail, reset to known fixtures, run all quality checks, and verify from the documentation that no real data, secrets, proprietary code, or external service are required.
