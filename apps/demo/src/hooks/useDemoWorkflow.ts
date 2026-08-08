import { useMemo, useRef, useState } from "react";
import {
  transitionReview,
  type ReviewAction,
  type WorkflowRecord,
} from "@reviewable-intake/core";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import {
  clearSnapshot,
  loadSnapshotOutcome,
  saveSnapshot,
  type DemoSnapshot,
  type StorageLike,
} from "../lib/localSnapshot";

interface InitialState {
  readonly snapshot: DemoSnapshot;
  readonly persistenceMessage: string | null;
}

type BrowserStorageOutcome =
  | { readonly status: "available"; readonly storage: StorageLike }
  | { readonly status: "server" }
  | { readonly status: "error"; readonly error: string };

function browserStorage(): BrowserStorageOutcome {
  if (typeof window === "undefined") {
    return { status: "server" };
  }

  try {
    return { status: "available", storage: window.localStorage };
  } catch {
    return {
      status: "error",
      error:
        "Local persistence is unavailable. Fresh fixtures are active for this session.",
    };
  }
}

function freshSnapshot(): DemoSnapshot {
  const records = createDemoRecords();

  return {
    records,
    selectedId: records[0].request.id,
  };
}

function selectedRecordFor(snapshot: DemoSnapshot): WorkflowRecord | null {
  return (
    snapshot.records.find(
      (record) => record.request.id === snapshot.selectedId,
    ) ?? null
  );
}

function initialState(storageOutcome: BrowserStorageOutcome): InitialState {
  if (storageOutcome.status === "error") {
    return {
      snapshot: freshSnapshot(),
      persistenceMessage: storageOutcome.error,
    };
  }

  if (storageOutcome.status === "available") {
    const loadOutcome = loadSnapshotOutcome(storageOutcome.storage);

    if (loadOutcome.status === "loaded") {
      return { snapshot: loadOutcome.snapshot, persistenceMessage: null };
    }

    if (loadOutcome.status === "error") {
      return {
        snapshot: freshSnapshot(),
        persistenceMessage: loadOutcome.error,
      };
    }
  }

  return { snapshot: freshSnapshot(), persistenceMessage: null };
}

export function useDemoWorkflow() {
  const storageOutcome = useMemo(() => browserStorage(), []);
  const storage =
    storageOutcome.status === "available" ? storageOutcome.storage : null;
  const [initial] = useState(() => initialState(storageOutcome));
  const [snapshot, setSnapshot] = useState(initial.snapshot);
  const snapshotRef = useRef(snapshot);
  const [persistenceMessage, setPersistenceMessage] = useState(
    initial.persistenceMessage,
  );

  const selectedRecord = selectedRecordFor(snapshot);

  function persist(nextSnapshot: DemoSnapshot): void {
    if (!storage) {
      return;
    }

    const result = saveSnapshot(storage, nextSnapshot);
    setPersistenceMessage(result.ok ? null : result.error);
  }

  function updateSnapshot(nextSnapshot: DemoSnapshot): void {
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    persist(nextSnapshot);
  }

  function selectRequest(id: string): void {
    const currentSnapshot = snapshotRef.current;

    if (!currentSnapshot.records.some((record) => record.request.id === id)) {
      return;
    }

    updateSnapshot({ ...currentSnapshot, selectedId: id });
  }

  function review(action: ReviewAction): void {
    const currentSnapshot = snapshotRef.current;
    const currentRecord = selectedRecordFor(currentSnapshot);

    if (!currentRecord) {
      return;
    }

    const result = transitionReview(
      currentRecord,
      action,
      new Date().toISOString(),
    );

    if (!result.ok) {
      setPersistenceMessage(result.error);
      return;
    }

    updateSnapshot({
      ...currentSnapshot,
      records: currentSnapshot.records.map((record) =>
        record.request.id === result.value.request.id ? result.value : record,
      ),
    });
  }

  function reset(): void {
    const nextSnapshot = freshSnapshot();
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);

    if (!storage) {
      return;
    }

    const result = clearSnapshot(storage);
    setPersistenceMessage(result.ok ? null : result.error);
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
