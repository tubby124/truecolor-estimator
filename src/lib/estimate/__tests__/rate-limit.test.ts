import { describe, expect, it } from "vitest";
import { publicEstimateRateLimitSubject } from "../rate-limit";

function request(headers: Record<string, string>): { headers: { get(name: string): string | null } } {
  return { headers: { get: (name) => headers[name.toLowerCase()] ?? null } };
}

describe("publicEstimateRateLimitSubject", () => {
  it("does not allow forged forwarding headers to create a new bucket", () => {
    expect(publicEstimateRateLimitSubject(request({ "x-forwarded-for": "198.51.100.99" }))).toBe("unattributed");
    expect(publicEstimateRateLimitSubject(request({ "cf-connecting-ip": "203.0.113.10" }))).toBe("unattributed");
  });

  it("keeps unrelated requests in the same conservative bucket", () => {
    expect(publicEstimateRateLimitSubject(request({}))).toBe(
      publicEstimateRateLimitSubject(request({ "cf-connecting-ip": "198.51.100.10", "x-forwarded-for": "203.0.113.20" })),
    );
  });
});
