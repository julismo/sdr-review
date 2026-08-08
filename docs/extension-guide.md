# Extension Guide

## Add a policy

Add a pure rule result in `packages/core/src/policy.ts`. The rule must return an outcome of `allow`, `review`, or `block` and a readable explanation. Add unit coverage for its ordering and derived recommendation.

## Add persistence

Implement the `StorageLike` shape used by the demo adapter. Keep persistence outside `packages/core`, return a typed failure instead of throwing into the user interface, and add a reset test.

## Preserve the boundary

Extensions may not add credentials, automatic outreach, live integrations, or real data to the default demo.
