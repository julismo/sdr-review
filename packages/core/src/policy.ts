import type {
  Evaluation,
  IntakeRequest,
  PolicyOutcome,
  PolicyResult,
} from "./types";

function highestOutcome(results: readonly PolicyResult[]): PolicyOutcome {
  if (results.some((result) => result.outcome === "block")) {
    return "block";
  }

  if (results.some((result) => result.outcome === "review")) {
    return "review";
  }

  return "allow";
}

export function evaluateRequest(request: IntakeRequest): Evaluation {
  const results: PolicyResult[] = [
    request.dataSensitivity === "restricted"
      ? {
          policyId: "restricted-data",
          outcome: "block",
          explanation:
            "Requests declaring restricted data are outside this local demo.",
        }
      : {
          policyId: "restricted-data",
          outcome: "allow",
          explanation: "The request does not declare restricted data.",
        },
    request.intent === "implement"
      ? {
          policyId: "implementation-scope",
          outcome: "review",
          explanation: "Implementation requests require human review.",
        }
      : {
          policyId: "implementation-scope",
          outcome: "allow",
          explanation: "The request scope can be considered locally.",
        },
    request.context?.trim()
      ? {
          policyId: "context-present",
          outcome: "allow",
          explanation: "The request includes enough context for follow-up.",
        }
      : {
          policyId: "context-present",
          outcome: "review",
          explanation: "Additional context is required before follow-up.",
        },
  ];

  return Object.freeze({
    recommendation: highestOutcome(results),
    results: Object.freeze(results.map((result) => Object.freeze(result))),
  });
}
