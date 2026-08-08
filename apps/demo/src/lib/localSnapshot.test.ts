import { transitionReview, type WorkflowRecord } from "@reviewable-intake/core";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
  type StorageLike,
} from "./localSnapshot";

const storageKey = "reviewable-intake-workbench.snapshot.v1";

function storageWithSnapshot(
  records: readonly unknown[],
  selectedId = createDemoRecords()[0].request.id,
): StorageLike {
  return {
    getItem: () => JSON.stringify({ records, selectedId }),
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

function approvedRecord(record: WorkflowRecord): WorkflowRecord {
  const result = transitionReview(
    record,
    "approve",
    "2026-08-07T10:00:00.000Z",
  );

  if (!result.ok) {
    throw new Error("Expected canonical fixture to be reviewable.");
  }

  return result.value;
}

describe("localSnapshot", () => {
  it("returns null for corrupt local data instead of throwing", () => {
    const storage = {
      getItem: () => "{not-json",
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSnapshot(storage)).toBeNull();
  });

  it("returns null for structurally invalid persisted records", () => {
    const storage = {
      getItem: () => '{"selectedId":"req-aurora","records":[42]}',
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSnapshot(storage)).toBeNull();
  });

  it("rejects a snapshot containing a duplicate canonical request ID", () => {
    const records = createDemoRecords();
    const duplicated = [records[0], records[0], ...records.slice(2)];

    expect(loadSnapshot(storageWithSnapshot(duplicated))).toBeNull();
  });

  it("rejects an altered canonical request even when the alteration is valid", () => {
    const records = createDemoRecords();
    const altered = records.map((record, index) =>
      index === 0
        ? {
            ...record,
            request: {
              ...record.request,
              company: "Altered Fieldworks",
            },
          }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(altered))).toBeNull();
  });

  it("rejects an invalid altered request", () => {
    const records = createDemoRecords();
    const altered = records.map((record, index) =>
      index === 0
        ? {
            ...record,
            request: {
              ...record.request,
              scope: "too short",
            },
          }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(altered))).toBeNull();
  });

  it("rejects a canonical record with its evaluation missing", () => {
    const records = createDemoRecords();
    const withoutEvaluation = records.map((record, index) => {
      if (index !== 0) {
        return record;
      }

      return {
        request: record.request,
        status: record.status,
        events: record.events,
      };
    });

    expect(loadSnapshot(storageWithSnapshot(withoutEvaluation))).toBeNull();
  });

  it("rejects a canonical record with a mismatched evaluation", () => {
    const records = createDemoRecords();
    const mismatched = records.map((record, index) =>
      index === 0
        ? {
            ...record,
            evaluation: {
              recommendation: "block",
              results: record.evaluation?.results ?? [],
            },
          }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(mismatched))).toBeNull();
  });

  it("rejects a terminal status without its legal reviewer event", () => {
    const records = createDemoRecords();
    const fabricatedTerminal = records.map((record, index) =>
      index === 0 ? { ...record, status: "approved" } : record,
    );

    expect(loadSnapshot(storageWithSnapshot(fabricatedTerminal))).toBeNull();
  });

  it("rejects a new record in place of its evaluated canonical record", () => {
    const records = createDemoRecords();
    const unevaluated = records.map((record, index) =>
      index === 0
        ? {
            request: record.request,
            status: "new",
            events: [record.events[0]],
          }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(unevaluated))).toBeNull();
  });

  it("rejects extra or duplicate audit events", () => {
    const records = createDemoRecords();
    const extraEvent = records.map((record, index) =>
      index === 0
        ? { ...record, events: [...record.events, record.events[1]] }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(extraEvent))).toBeNull();
  });

  it("rejects altered canonical system event timestamps", () => {
    const records = createDemoRecords();
    const alteredTimestamp = records.map((record, index) =>
      index === 0
        ? {
            ...record,
            events: [
              { ...record.events[0], occurredAt: "2026-08-07T09:30:00.000Z" },
              record.events[1],
            ],
          }
        : record,
    );

    expect(loadSnapshot(storageWithSnapshot(alteredTimestamp))).toBeNull();
  });

  it("rejects an approval with an invalid reviewer timestamp", () => {
    const records = createDemoRecords();
    const approved = approvedRecord(records[0]);
    const invalidTimestamp = [
      {
        ...approved,
        events: [
          approved.events[0],
          approved.events[1],
          { ...approved.events[2], occurredAt: "not-a-timestamp" },
        ],
      },
      ...records.slice(1),
    ];

    expect(loadSnapshot(storageWithSnapshot(invalidTimestamp))).toBeNull();
  });

  it("rejects a snapshot whose selected request does not exist", () => {
    expect(
      loadSnapshot(storageWithSnapshot(createDemoRecords(), "missing-request")),
    ).toBeNull();
  });

  it("loads a canonical snapshot with one legal reviewer approval", () => {
    const records = createDemoRecords();
    const approved = [approvedRecord(records[0]), ...records.slice(1)];

    expect(loadSnapshot(storageWithSnapshot(approved))).toEqual({
      records: approved,
      selectedId: records[0].request.id,
    });
  });

  it("reports a persistence failure while keeping the caller in control", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota unavailable");
      },
      removeItem: () => undefined,
    };

    expect(saveSnapshot(storage, { selectedId: "req-aurora", records: [] })).toEqual({
      ok: false,
      error: "Local persistence is unavailable. This session remains usable.",
    });
  });

  it("clears only the workbench snapshot key", () => {
    const removed: string[] = [];
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: (key: string) => removed.push(key),
    };

    const result = clearSnapshot(storage);

    expect(removed).toEqual([storageKey]);
    expect(result).toEqual({ ok: true });
  });

  it("reports a non-throwing persistence failure when clearing fails", () => {
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("storage unavailable");
      },
    };

    expect(clearSnapshot(storage)).toEqual({
      ok: false,
      error:
        "Local snapshot could not be cleared. Fresh fixtures are active for this session, but reloading may restore the previous saved state.",
    });
  });
});
