import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("review solicitation policy", () => {
  it("does not offer a discount or gate the review request on satisfaction", () => {
    const emailSource = [
      source("src/lib/email/orderConfirmation.ts"),
      source("src/lib/email/reviewRequest.ts"),
    ].join("\n");

    expect(emailSource).not.toMatch(/review[\s\S]{0,120}\$10 off|\$10 off[\s\S]{0,120}review/i);
    expect(emailSource).not.toMatch(/happy with the results|if you(?:'|’)re happy|not 100% happy/i);
    expect(emailSource).toContain("We send the same request to every customer");
    expect(emailSource).toContain("there is no reward for leaving a review");
    expect(source("src/lib/email/reviewRequest.ts")).not.toContain("bcc: process.env.SMTP_BCC");
  });

  it("blocks creation and staff redistribution of review-incentive coupons", () => {
    const apiSource = source("src/app/api/staff/coupons/route.ts");
    const uiSource = source("src/app/staff/coupons/CouponsClient.tsx");

    expect(apiSource).toContain('body.type === "review"');
    expect(apiSource).toContain("Review-incentive discount codes are not permitted");
    expect(uiSource).not.toContain('<option value="review">');
    expect(uiSource).toContain("Honour previously promised redemptions; do not distribute this code.");
  });
});
