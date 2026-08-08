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

  it.each([
    ["null", null],
    ["an array", []],
  ])("rejects %s without throwing", (_label, candidate) => {
    expect(() => validateRequest(candidate)).not.toThrow();
    expect(validateRequest(candidate)).toEqual({
      ok: false,
      errors: [
        {
          field: "id",
          message: "Request ID must contain at least three characters.",
        },
        {
          field: "company",
          message: "Company must contain at least two visible characters.",
        },
        {
          field: "intent",
          message: "Intent must be explore, evaluate, or implement.",
        },
        {
          field: "dataSensitivity",
          message: "Data sensitivity must be standard or restricted.",
        },
        {
          field: "consent",
          message: "Consent is required before a request can be evaluated.",
        },
        {
          field: "scope",
          message: "Scope must contain at least twelve visible characters.",
        },
      ],
    });
  });

  it("rejects non-string text fields with ordered actionable errors", () => {
    const candidate = {
      ...validRequest,
      id: 42,
      company: false,
      scope: { summary: "Not text" },
      context: ["Not text"],
    };

    expect(() => validateRequest(candidate)).not.toThrow();
    expect(validateRequest(candidate)).toEqual({
      ok: false,
      errors: [
        {
          field: "id",
          message: "Request ID must contain at least three characters.",
        },
        {
          field: "company",
          message: "Company must contain at least two visible characters.",
        },
        {
          field: "scope",
          message: "Scope must contain at least twelve visible characters.",
        },
        {
          field: "context",
          message: "Context must be text when provided.",
        },
      ],
    });
  });
});
