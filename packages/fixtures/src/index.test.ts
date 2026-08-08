import * as core from "@reviewable-intake/core";
import { createDemoRecords } from "./index";

describe("createDemoRecords", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates exactly six synthetic records", () => {
    expect(createDemoRecords()).toHaveLength(6);
  });

  it("validates every authored fixture through the real public boundary", () => {
    const validateRequest = core.validateRequest;
    const validateRequestSpy = vi.spyOn(core, "validateRequest");

    const records = createDemoRecords();

    expect(validateRequestSpy).toHaveBeenCalledTimes(6);
    expect(
      validateRequestSpy.mock.calls.map(([candidate]) =>
        validateRequest(candidate),
      ),
    ).toEqual(
      records.map(({ request }) => ({
        ok: true,
        value: request,
      })),
    );
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
