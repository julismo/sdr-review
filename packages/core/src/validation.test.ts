import { validateRequest } from "./validation";

const validRequest = {
  id: "req-aurora",
  company: "Aurora Fieldworks",
  intent: "evaluate" as const,
  dataSensitivity: "standard" as const,
  consent: true,
  scope: "Evaluate a deterministic review workflow for a small operations team.",
  context: "The team needs a transparent recommendation before human follow-up.",
};

describe("validateRequest", () => {
  it("normalizes a valid synthetic request", () => {
    expect(validateRequest(validRequest)).toEqual({
      ok: true,
      value: validRequest,
    });
  });

  it("rejects missing consent before policy evaluation", () => {
    expect(
      validateRequest({
        ...validRequest,
        consent: false,
      }),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "consent",
          message: "Consent is required before a request can be evaluated.",
        },
      ],
    });
  });

  it("returns all actionable field errors", () => {
    expect(
      validateRequest({
        ...validRequest,
        company: " ",
        scope: "Short",
      }),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "company",
          message: "Company must contain at least two visible characters.",
        },
        {
          field: "scope",
          message: "Scope must contain at least twelve visible characters.",
        },
      ],
    });
  });
});
