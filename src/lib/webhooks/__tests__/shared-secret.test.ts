import { describe, expect, it } from "vitest";
import { constantTimeSecretEqual } from "../shared-secret";

describe("constantTimeSecretEqual", () => {
  it("accepts an exact shared-secret match", () => {
    expect(constantTimeSecretEqual("correct-secret", "correct-secret")).toBe(true);
  });

  it("rejects missing, different-length, and unicode-mismatched values", () => {
    expect(constantTimeSecretEqual(null, "correct-secret")).toBe(false);
    expect(constantTimeSecretEqual("short", "correct-secret")).toBe(false);
    expect(constantTimeSecretEqual("secrét", "secret")).toBe(false);
  });
});
