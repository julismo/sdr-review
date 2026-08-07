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
  return candidate !== null && typeof candidate === "object" && !Array.isArray(candidate);
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

  return (
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
    isOneOf(candidate.recommendation, ["allow", "review", "block"] as const) &&
    candidate.results.every(isPolicyResult)
  );
}

function isAuditEvent(candidate: unknown): boolean {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
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
    !Array.isArray(candidate.events) ||
    !candidate.events.every(isAuditEvent)
  ) {
    return false;
  }

  return candidate.evaluation === undefined || isEvaluation(candidate.evaluation);
}

function isSnapshot(candidate: unknown): candidate is DemoSnapshot {
  if (!isRecord(candidate)) {
    return false;
  }

  return (
    typeof candidate.selectedId === "string" &&
    Array.isArray(candidate.records) &&
    candidate.records.every(isWorkflowRecord)
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
  try {
    storage.removeItem(snapshotKey);
  } catch {
    // A failed local clear must not interrupt the active session.
  }
}
