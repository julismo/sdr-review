import { act, renderHook } from "@testing-library/react";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import { snapshotKey } from "../lib/localSnapshot";
import { useDemoWorkflow } from "./useDemoWorkflow";

describe("useDemoWorkflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("approves a selected request and restores fixtures on reset", () => {
    const { result } = renderHook(() => useDemoWorkflow());
    const firstId = result.current.records[0].request.id;

    act(() => {
      result.current.selectRequest(firstId);
      result.current.review("approve");
    });

    expect(result.current.selectedRecord?.status).toBe("approved");

    act(() => {
      result.current.reset();
    });

    expect(result.current.records).toHaveLength(6);
    expect(result.current.records[0].status).not.toBe("approved");
  });

  it("repairs an invalid persisted selected ID before retaining the snapshot", () => {
    window.localStorage.setItem(
      snapshotKey,
      JSON.stringify({
        records: createDemoRecords(),
        selectedId: "missing-request",
      }),
    );

    const { result } = renderHook(() => useDemoWorkflow());

    expect(result.current.selectedRecord?.request.id).toBe("req-aurora");
    expect(window.localStorage.getItem(snapshotKey)).toContain(
      '"selectedId":"req-aurora"',
    );
  });

  it("remains usable when accessing browser storage throws", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage access denied", "SecurityError");
      },
    });

    try {
      const { result } = renderHook(() => useDemoWorkflow());

      act(() => {
        result.current.review("approve");
      });

      expect(result.current.selectedRecord?.status).toBe("approved");
      expect(result.current.persistenceMessage).toBeNull();
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "localStorage", descriptor);
      }
    }
  });
});
