import {
  createWorkflow,
  evaluateWorkflow,
  type IntakeRequest,
  type WorkflowRecord,
} from "@reviewable-intake/core";

const requests: readonly IntakeRequest[] = [
  {
    id: "req-aurora",
    company: "Aurora Fieldworks",
    intent: "explore",
    dataSensitivity: "standard",
    consent: true,
    scope: "Explore a local workbench for transparent intake review.",
    context: "The team wants a short demonstration with no external services.",
  },
  {
    id: "req-boreal",
    company: "Boreal Systems",
    intent: "implement",
    dataSensitivity: "standard",
    consent: true,
    scope: "Assess a reviewable workflow before implementation begins.",
  },
  {
    id: "req-cascade",
    company: "Cascade Studio",
    intent: "evaluate",
    dataSensitivity: "standard",
    consent: true,
    scope: "Evaluate a deterministic workflow with a reviewable recommendation.",
    context: "A small team wants a local reference implementation.",
  },
  {
    id: "req-drift",
    company: "Drift Workshop",
    intent: "explore",
    dataSensitivity: "restricted",
    consent: true,
    scope: "Explore a request that declares information outside the demo boundary.",
    context: "The demo must explain why this request cannot proceed automatically.",
  },
  {
    id: "req-ember",
    company: "Ember Ledger",
    intent: "evaluate",
    dataSensitivity: "standard",
    consent: true,
    scope: "Evaluate a compact deterministic policy system for internal review.",
    context: "The request includes enough detail for a direct human decision.",
  },
  {
    id: "req-fjord",
    company: "Fjord Assembly",
    intent: "implement",
    dataSensitivity: "standard",
    consent: true,
    scope: "Review a proposal for a staged workflow implementation.",
    context: "The team needs explicit ownership before any implementation work.",
  },
];

export function createDemoRecords(): readonly WorkflowRecord[] {
  return Object.freeze(
    requests.map((request, index) => {
      const createdAt = "2026-08-07T09:0" + index + ":00.000Z";
      const evaluatedAt = "2026-08-07T09:1" + index + ":00.000Z";

      return evaluateWorkflow(createWorkflow(request, createdAt), evaluatedAt);
    }),
  );
}
