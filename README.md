# Reviewable Intake Workbench

A local-only reference implementation for deterministic intake recommendations and human review.

## What it demonstrates

- Typed request validation without contact data
- Deterministic and explainable policy results
- Explicit human review transitions
- Append-only audit events
- Browser-local demo persistence and reset

## Quick start

Node.js 24 or newer is required.

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
npm run test:scanner
npm run build
npm run test:e2e
npm run scan:public-safety
npm run verify:release-docs
```

The public-safety scanner checks tracked text files in the working tree. Pass one Git revision after `--` to scan that reachable snapshot; CI applies the same command to every reachable revision. The scanner applies its strict credential, private-key, and email rules to `package-lock.json`, but exempts that generated dependency lockfile from external-URL and phone-like rules because registry URLs and version-like numeric metadata are expected there. This automated detection is not exhaustive. `npm ci` enforces manifest/lockfile consistency and uses recorded integrity metadata during installation, providing a separate dependency-review boundary.

## Boundaries

This is not a CRM, messaging service, AI agent, or production decision system. It contains no real data, credentials, external integrations, analytics, authentication, or database.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [PROVENANCE.md](PROVENANCE.md), [the data boundary](docs/data-boundary.md), and [SECURITY.md](SECURITY.md) before adapting it. Reuse is governed by the [LICENSE](LICENSE), contributions follow [CONTRIBUTING.md](CONTRIBUTING.md), and supported customization paths are described in the [extension guide](docs/extension-guide.md).
