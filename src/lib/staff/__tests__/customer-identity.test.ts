import { describe, expect, it } from "vitest";
import {
  applyCustomerLookupResult,
  applyPickedCustomer,
  normalizeContactForSubmit,
  type ManualOrderContactForm,
} from "../customer-identity";

const baseForm: ManualOrderContactForm = {
  name: "Alice Old",
  email: "old@example.com",
  company: "Old Co",
  phone: "306-111-1111",
};

describe("staff manual-order customer identity harness", () => {
  it("replaces all identity fields when staff picks a saved customer, even when company/phone are blank", () => {
    const next = applyPickedCustomer(baseForm, {
      email: "new@example.com",
      name: "Bob New",
      company: null,
      phone: null,
    });

    expect(next).toEqual({
      name: "Bob New",
      email: "new@example.com",
      company: "",
      phone: "",
    });
  });

  it("replaces stale typed fields when lookup confirms the current email belongs to a saved customer", () => {
    const next = applyCustomerLookupResult(baseForm, "old@example.com", {
      exists: true,
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });

    expect(next.form).toEqual({
      name: "Bob New",
      email: "old@example.com",
      company: "New Co",
      phone: "306-222-2222",
    });
    expect(next.warning).toContain("Saved customer matched");
  });

  it("ignores stale async lookup responses for an email the form no longer contains", () => {
    const next = applyCustomerLookupResult(
      { ...baseForm, email: "latest@example.com" },
      "older@example.com",
      { exists: true, name: "Older Customer", company: "Older Co", phone: "306-333-3333" },
    );

    expect(next.form).toEqual({ ...baseForm, email: "latest@example.com" });
    expect(next.ignored).toBe(true);
  });

  it("normalizes submit contact without leaking whitespace or empty company/phone strings", () => {
    expect(normalizeContactForSubmit({
      name: "  Bob New  ",
      email: "  BOB@EXAMPLE.COM  ",
      company: "   ",
      phone: "  ",
    })).toEqual({
      name: "Bob New",
      email: "bob@example.com",
      company: undefined,
      phone: undefined,
    });
  });
});
