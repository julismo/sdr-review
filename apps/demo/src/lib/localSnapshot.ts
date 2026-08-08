import {
  transitionReview,
  validateRequest,
  type AuditEvent,
  type Evaluation,
  type IntakeRequest,
  type ReviewAction,
  type ReviewStatus,
  type WorkflowRecord,
} from "@reviewable-intake/core";
import { createDemoRecords } from "@reviewable-intake/fixtures";

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

export type SnapshotLoadOutcome =
  | { readonly status: "loaded"; readonly snapshot: DemoSnapshot }
  | { readonly status: "empty" }
  | { readonly status: "error"; readonly error: string };

const snapshotReadError =
  "Saved workflow data could not be read safely. Fresh fixtures are active for this session.";

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return candidate !== null && typeof candidate === "object" && !Array.isArray(candidate);
}

function hasExactKeys(
  candidate: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const candidateKeys = Object.keys(candidate);

  return (
    candidateKeys.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(candidate, key))
  );
}

function isOneOf<T extends string>(
  candidate: unknown,
  values: readonly T[],
): candidate is T {
  return typeof candidate === "string" && values.some((value) => value === candidate);
}

function isIntakeRequest(candidate: unknown): boolean {
  if (!isRecord(candidate)) {
    return false;
  }

  const context = candidate.context;
  const keys = [
    "id",
    "company",
    "intent",
    "dataSensitivity",
    "consent",
    "scope",
    ...(context === undefined ? [] : ["context"]),
  ];

  return (
    hasExactKeys(candidate, keys) &&
    typeof candidate.id === "string" &&
    typeof candidate.company === "string" &&
    isOneOf(candidate.intent, ["explore", "evaluate", "implement"] as const) &&
    isOneOf(candidate.dataSensitivity, ["standard", "restricted"] as const) &&
    typeof candidate.consent === "boolean" &&
    typeof candidate.scope === "string" &&
    (context === undefined || typeof context === "string")
  );
}

function isPolicyResult(candidate: unknown): boolean {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
    hasExactKeys(candidate, ["policyId", "outcome", "explanation"]) &&
    typeof candidate.policyId === "string" &&
    isOneOf(candidate.outcome, ["allow", "review", "block"] as const) &&
    typeof candidate.explanation === "string"
  );
}

function isEvaluation(candidate: unknown): boolean {
  if (!isRecord(candidate) || !Array.isArray(candidate.results)) {
    return false;
  }

  return (
    hasExactKeys(candidate, ["recommendation", "results"]) &&
    isOneOf(candidate.recommendation, ["allow", "review", "block"] as const) &&
    candidate.results.every(isPolicyResult)
  );
}

function isAuditEvent(candidate: unknown): boolean {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
    hasExactKeys(candidate, ["id", "occurredAt", "actor", "type", "summary"]) &&
    typeof candidate.id === "string" &&
    typeof candidate.occurredAt === "string" &&
    isOneOf(candidate.actor, ["system", "reviewer"] as const) &&
    isOneOf(
      candidate.type,
      [
        "request_created",
        "request_evaluated",
        "request_approved",
        "context_requested",
        "request_rejected",
      ] as const,
    ) &&
    typeof candidate.summary === "string"
  );
}

function isWorkflowRecord(candidate: unknown): candidate is WorkflowRecord {
  if (
    !isRecord(candidate) ||
    !hasExactKeys(candidate, ["request", "status", "evaluation", "events"]) ||
    !isIntakeRequest(candidate.request) ||
    !isOneOf(
      candidate.status,
      [
        "new",
        "evaluated",
        "needs_review",
        "approved",
        "context_requested",
        "rejected",
      ] as const,
    ) ||
    !isEvaluation(candidate.evaluation) ||
    !Array.isArray(candidate.events) ||
    !candidate.events.every(isAuditEvent)
  ) {
    return false;
  }

  return true;
}

function isSnapshot(candidate: unknown): candidate is DemoSnapshot {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
    hasExactKeys(candidate, ["selectedId", "records"]) &&
    typeof candidate.selectedId === "string" &&
    Array.isArray(candidate.records) &&
    candidate.records.every(isWorkflowRecord)
  );
}

function isSameRequest(left: IntakeRequest, right: IntakeRequest): boolean {
  return (
    left.id === right.id &&
    left.company === right.company &&
    left.intent === right.intent &&
    left.dataSensitivity === right.dataSensitivity &&
    left.consent === right.consent &&
    left.scope === right.scope &&
    left.context === right.context
  );
}

function isSameEvaluation(
  left: Evaluation | undefined,
  right: Evaluation | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.recommendation === right.recommendation &&
    left.results.length === right.results.length &&
    left.results.every((result, index) => {
      const expected = right.results[index];

      return (
        result.policyId === expected.policyId &&
        result.outcome === expected.outcome &&
        result.explanation === expected.explanation
      );
    })
  );
}

function isSameEvent(left: AuditEvent, right: AuditEvent): boolean {
  return (
    left.id === right.id &&
    left.occurredAt === right.occurredAt &&
    left.actor === right.actor &&
    left.type === right.type &&
    left.summary === right.summary
  );
}

function isSameWorkflow(
  left: WorkflowRecord,
  right: WorkflowRecord,
): boolean {
  return (
    isSameRequest(left.request, right.request) &&
    left.status === right.status &&
    isSameEvaluation(left.evaluation, right.evaluation) &&
    left.events.length === right.events.length &&
    left.events.every((event, index) => isSameEvent(event, right.events[index]))
  );
}

function reviewActionFor(status: ReviewStatus): ReviewAction | null {
  if (status === "approved") {
    return "approve";
  }

  if (status === "context_requested") {
    return "request_context";
  }

  return status === "rejected" ? "reject" : null;
}

function isLegalReviewerTimestamp(
  occurredAt: string,
  evaluatedAt: string,
): boolean {
  const timestamp = new Date(occurredAt);

  return (
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.toISOString() === occurredAt &&
    timestamp.getTime() >= new Date(evaluatedAt).getTime()
  );
}

function restoreCanonicalRecord(
  candidate: WorkflowRecord,
  base: WorkflowRecord,
): WorkflowRecord | null {
  const requestValidation = validateRequest(candidate.request);

  if (
    !requestValidation.ok ||
    !isSameRequest(candidate.request, base.request) ||
    !isSameRequest(requestValidation.value, base.request) ||
    !isSameEvaluation(candidate.evaluation, base.evaluation)
  ) {
    return null;
  }

  if (isSameWorkflow(candidate, base)) {
    return base;
  }

  if (candidate.events.length !== base.events.length + 1) {
    return null;
  }

  const action = reviewActionFor(candidate.status);
  const reviewerEvent = candidate.events[base.events.length];
  const evaluatedEvent = base.events[base.events.length - 1];

  if (
    !action ||
    !isLegalReviewerTimestamp(reviewerEvent.occurredAt, evaluatedEvent.occurredAt)
  ) {
    return null;
  }

  const transition = transitionReview(base, action, reviewerEvent.occurredAt);

  return transition.ok && isSameWorkflow(candidate, transition.value)
    ? transition.value
    : null;
}

function restoreCanonicalSnapshot(candidate: DemoSnapshot): DemoSnapshot | null {
  const baseRecords = createDemoRecords();

  if (candidate.records.length !== baseRecords.length) {
    return null;
  }

  const restoredRecords: WorkflowRecord[] = [];
  const restoredIds = new Set<string>();

  for (const candidateRecord of candidate.records) {
    const id = candidateRecord.request.id;
    const baseRecord = baseRecords.find((record) => record.request.id === id);

    if (!baseRecord || restoredIds.has(id)) {
      return null;
    }

    const restored = restoreCanonicalRecord(candidateRecord, baseRecord);

    if (!restored) {
      return null;
    }

    restoredIds.add(id);
    restoredRecords.push(restored);
  }

  if (!restoredIds.has(candidate.selectedId)) {
    return null;
  }

  return Object.freeze({
    selectedId: candidate.selectedId,
    records: Object.freeze(restoredRecords),
  });
}

export function loadSnapshotOutcome(storage: StorageLike): SnapshotLoadOutcome {
  try {
    const raw = storage.getItem(snapshotKey);
    if (raw === null) {
      return { status: "empty" };
    }

    const parsed: unknown = JSON.parse(raw);
    const snapshot = isSnapshot(parsed) ? restoreCanonicalSnapshot(parsed) : null;

    return snapshot
      ? { status: "loaded", snapshot }
      : { status: "error", error: snapshotReadError };
  } catch {
    return { status: "error", error: snapshotReadError };
  }
}

export function loadSnapshot(storage: StorageLike): DemoSnapshot | null {
  const outcome = loadSnapshotOutcome(storage);
  return outcome.status === "loaded" ? outcome.snapshot : null;
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

export function clearSnapshot(storage: StorageLike): PersistenceResult {
  try {
    storage.removeItem(snapshotKey);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Local snapshot could not be cleared. Fresh fixtures are active for this session, but reloading may restore the previous saved state.",
    };
  }
}
