import { createDemoRecords } from "./index";

describe("createDemoRecords", () => {
  it("creates exactly six synthetic records", () => {
    expect(createDemoRecords()).toHaveLength(6);
  });
});
