import { evaluateRequest } from "./policy";
import type { IntakeRequest } from "./types";

const request: IntakeRequest = {
  id: "req-boreal",
  company: "Boreal Systems",
  intent: "implement",
  dataSensitivity: "standard",
  consent: true,
  scope: "Assess a reviewable workflow before implementation begins.",
};

describe("evaluateRequest", () => {
  it("derives review from an implementation request and explains the result", () => {
    expect(evaluateRequest(request)).toEqual({
      recommendation: "review",
      results: [
        {
          policyId: "restricted-data",
          outcome: "allow",
          explanation: "The request does not declare restricted data.",
        },
        {
          policyId: "implementation-scope",
          outcome: "review",
          explanation: "Implementation requests require human review.",
        },
        {
          policyId: "context-present",
          outcome: "review",
          explanation: "Additional context is required before follow-up.",
        },
      ],
    });
  });
});
