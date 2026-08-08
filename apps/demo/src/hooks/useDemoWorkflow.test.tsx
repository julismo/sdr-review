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

  it("rejects a persisted snapshot whose selected ID is invalid", () => {
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
      '"selectedId":"missing-request"',
    );
  });

  it("shows a failed-clear warning while resetting memory and may restore the old snapshot on reload", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    let storedSnapshot: string | null = null;
    const refusingStorage = {
      getItem: (key: string) => (key === snapshotKey ? storedSnapshot : null),
      setItem: (key: string, value: string) => {
        if (key === snapshotKey) {
          storedSnapshot = value;
        }
      },
      removeItem: () => {
        throw new DOMException("Storage removal denied", "SecurityError");
      },
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: refusingStorage,
    });

    try {
      const firstMount = renderHook(() => useDemoWorkflow());

      act(() => {
        firstMount.result.current.review("approve");
      });

      expect(firstMount.result.current.selectedRecord?.status).toBe("approved");

      act(() => {
        firstMount.result.current.reset();
      });

      expect(firstMount.result.current.records).toEqual(createDemoRecords());
      expect(firstMount.result.current.persistenceMessage).toBe(
        "Local snapshot could not be cleared. Fresh fixtures are active for this session, but reloading may restore the previous saved state.",
      );
      firstMount.unmount();

      const reloadedMount = renderHook(() => useDemoWorkflow());

      expect(reloadedMount.result.current.selectedRecord?.status).toBe(
        "approved",
      );
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "localStorage", descriptor);
      }
    }
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
