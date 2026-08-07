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
  try {
    storage.removeItem(snapshotKey);
  } catch {
    // A failed local clear must not interrupt the active session.
  }
}
