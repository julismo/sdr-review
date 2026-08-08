import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createDemoRecords } from "@reviewable-intake/fixtures";
import { snapshotKey } from "../lib/localSnapshot";
import { useDemoWorkflow } from "./useDemoWorkflow";

describe("useDemoWorkflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

      expect(result.current.records).toEqual(createDemoRecords());
      expect(result.current.persistenceMessage).toBe(
        "Local persistence is unavailable. Fresh fixtures are active for this session.",
      );

      const secondId = result.current.records[1].request.id;

      act(() => {
        result.current.selectRequest(secondId);
      });

      expect(result.current.selectedRecord?.request.id).toBe(secondId);
      expect(result.current.persistenceMessage).toBe(
        "Local persistence is unavailable. Fresh fixtures are active for this session.",
      );

      act(() => {
        result.current.review("approve");
      });

      expect(result.current.selectedRecord?.status).toBe("approved");
      expect(result.current.persistenceMessage).toBe(
        "Local persistence is unavailable. Fresh fixtures are active for this session.",
      );

      act(() => {
        result.current.reset();
      });

      expect(result.current.records).toEqual(createDemoRecords());
      expect(result.current.persistenceMessage).toBe(
        "Local persistence is unavailable. Fresh fixtures are active for this session.",
      );
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "localStorage", descriptor);
      }
    }
  });

  it("starts fresh after a storage read failure and clears the warning after a successful save", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    let savedSnapshot: string | null = null;
    const recoveringStorage = {
      getItem: () => {
        throw new DOMException("Storage read denied", "SecurityError");
      },
      setItem: (_key: string, value: string) => {
        savedSnapshot = value;
      },
      removeItem: () => undefined,
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: recoveringStorage,
    });

    try {
      const { result } = renderHook(() => useDemoWorkflow());

      expect(result.current.records).toEqual(createDemoRecords());
      expect(result.current.persistenceMessage).toBe(
        "Saved workflow data could not be read safely. Fresh fixtures are active for this session.",
      );

      act(() => {
        result.current.review("approve");
      });

      expect(result.current.selectedRecord?.status).toBe("approved");
      expect(savedSnapshot).not.toBeNull();
      expect(result.current.persistenceMessage).toBeNull();
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "localStorage", descriptor);
      }
    }
  });

  it("starts fresh and warns when saved data is corrupt", () => {
    window.localStorage.setItem(snapshotKey, "{not-json");

    const { result } = renderHook(() => useDemoWorkflow());

    expect(result.current.records).toEqual(createDemoRecords());
    expect(result.current.persistenceMessage).toBe(
      "Saved workflow data could not be read safely. Fresh fixtures are active for this session.",
    );
  });

  it("does not report a browser persistence error during server rendering", () => {
    let persistenceMessage: string | null | undefined;

    function Probe() {
      persistenceMessage = useDemoWorkflow().persistenceMessage;
      return null;
    }

    vi.stubGlobal("window", undefined);
    renderToString(<Probe />);

    expect(persistenceMessage).toBeNull();
  });
});
