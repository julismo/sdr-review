# Architecture

The repository separates domain policy from the browser demo.

```text
packages/core      validation, policies, workflow transitions, audit events
packages/fixtures  six fictional records
apps/demo          React interface and localStorage adapter
```

The core accepts plain TypeScript data and has no React, browser, storage, or network dependency. The demo is responsible for rendering, selection, local persistence, and reset.

Automatic recommendations are never approvals. The reviewer must choose an allowed transition, and each accepted transition appends a new audit event.
