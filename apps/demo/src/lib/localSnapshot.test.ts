import { clearSnapshot, loadSnapshot, saveSnapshot } from "./localSnapshot";

const storageKey = "reviewable-intake-workbench.snapshot.v1";

describe("localSnapshot", () => {
  it("returns null for corrupt local data instead of throwing", () => {
    const storage = {
      getItem: () => "{not-json",
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSnapshot(storage)).toBeNull();
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

    clearSnapshot(storage);

    expect(removed).toEqual([storageKey]);
  });
});
