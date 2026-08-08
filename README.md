# Reviewable Intake Workbench

A local-only reference implementation for deterministic intake recommendations and human review.

## What it demonstrates

- Typed request validation without contact data
- Deterministic and explainable policy results
- Explicit human review transitions
- Append-only audit events
- Browser-local demo persistence and reset

## Quick start

```text
npm install
npm run dev
```

Open the loopback URL printed by Vite. The demo contains six fictional records and makes no requests to external services.

## Quality checks

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run scan:public-safety
npm run verify:release-docs
```

The public-safety scanner checks tracked text files in the working tree. Pass one Git revision after `--` to scan that reachable snapshot; CI applies the same command to every reachable revision.

## Boundaries

This is not a CRM, messaging service, AI agent, or production decision system. It contains no real data, credentials, external integrations, analytics, authentication, or database.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [PROVENANCE.md](PROVENANCE.md), [the data boundary](docs/data-boundary.md), and [SECURITY.md](SECURITY.md) before adapting it.
