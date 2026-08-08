import {
  createWorkflow,
  evaluateWorkflow,
  transitionReview,
} from "./workflow";
import type { IntakeRequest } from "./types";

const request: IntakeRequest = {
  id: "req-cascade",
  company: "Cascade Studio",
  intent: "evaluate",
  dataSensitivity: "standard",
  consent: true,
  scope: "Evaluate a deterministic workflow with a reviewable recommendation.",
  context: "A small team wants a local reference implementation.",
};

describe("workflow", () => {
  it("records evaluation then a valid human approval as immutable events", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const evaluated = evaluateWorkflow(created, "2026-08-07T09:01:00.000Z");
    const approved = transitionReview(
      evaluated,
      "approve",
      "2026-08-07T09:02:00.000Z",
    );

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      throw new Error("Expected approval to succeed.");
    }

    expect(approved.value.status).toBe("approved");
    expect(approved.value.events).toHaveLength(3);
    expect(Object.isFrozen(approved.value.events)).toBe(true);
    expect(Object.isFrozen(approved.value.events[2])).toBe(true);
  });

  it("rejects a review action before evaluation without mutating the workflow", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const result = transitionReview(
      created,
      "reject",
      "2026-08-07T09:01:00.000Z",
    );

    expect(result).toEqual({
      ok: false,
      error: "A request must be evaluated before it can be reviewed.",
      value: created,
    });
  });

  it("returns an evaluated workflow unchanged when evaluation is repeated", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const evaluated = evaluateWorkflow(created, "2026-08-07T09:01:00.000Z");
    const repeated = evaluateWorkflow(evaluated, "2026-08-07T09:02:00.000Z");

    expect(repeated).toBe(evaluated);
    expect(repeated.events).toHaveLength(evaluated.events.length);
    expect(new Set(repeated.events.map((event) => event.id)).size).toBe(
      repeated.events.length,
    );
  });

  it("returns an approved workflow unchanged when evaluation is attempted again", () => {
    const created = createWorkflow(request, "2026-08-07T09:00:00.000Z");
    const evaluated = evaluateWorkflow(created, "2026-08-07T09:01:00.000Z");
    const approved = transitionReview(
      evaluated,
      "approve",
      "2026-08-07T09:02:00.000Z",
    );

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      throw new Error("Expected approval to succeed.");
    }

    const repeated = evaluateWorkflow(
      approved.value,
      "2026-08-07T09:03:00.000Z",
    );

    expect(repeated).toBe(approved.value);
    expect(repeated.events).toHaveLength(approved.value.events.length);
    expect(new Set(repeated.events.map((event) => event.id)).size).toBe(
      repeated.events.length,
    );
  });
});
