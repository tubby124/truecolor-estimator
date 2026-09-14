import { describe, expect, it } from "vitest";
import { estimateEndpoint } from "../endpoint";

describe("estimateEndpoint", () => {
  it("keeps customer pricing on the sanitized public route", () => {
    expect(estimateEndpoint("public")).toBe("/api/estimate");
  });

  it("routes staff pricing to the authenticated full-response route", () => {
    expect(estimateEndpoint("staff")).toBe("/api/staff/estimate");
  });
});
