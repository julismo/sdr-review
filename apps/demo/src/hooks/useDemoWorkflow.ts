import { useMemo, useRef, useState } from "react";
import {
  transitionReview,
  type ReviewAction,
  type WorkflowRecord,
} from "@reviewable-intake/core";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
  type DemoSnapshot,
  type StorageLike,
} from "../lib/localSnapshot";

interface InitialState {
  readonly snapshot: DemoSnapshot;
  readonly persistenceMessage: string | null;
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
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

function initialState(storage: StorageLike | null): InitialState {
  const persisted = storage ? loadSnapshot(storage) : null;

  if (persisted) {
    return { snapshot: persisted, persistenceMessage: null };
  }

  return { snapshot: freshSnapshot(), persistenceMessage: null };
}

export function useDemoWorkflow() {
  const storage = useMemo(() => browserStorage(), []);
  const [initial] = useState(() => initialState(storage));
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
      setPersistenceMessage(null);
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
