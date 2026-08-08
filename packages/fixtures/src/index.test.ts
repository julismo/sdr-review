import * as core from "@reviewable-intake/core";
import { createDemoRecords } from "./index";

describe("createDemoRecords", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates exactly six synthetic records", () => {
    expect(createDemoRecords()).toHaveLength(6);
  });

  it("fails deterministically when an authored fixture is invalid", () => {
    vi.spyOn(core, "validateRequest").mockReturnValueOnce({
      ok: false,
      errors: [
        {
          field: "scope",
          message: "Scope must contain at least twelve visible characters.",
        },
      ],
    });

    expect(() => createDemoRecords()).toThrowError(
      "Fixture request 1 is invalid: scope: Scope must contain at least twelve visible characters.",
    );
  });
});
