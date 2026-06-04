import { describe, expect, it } from "vitest";
import {
  applyPickedCustomer,
  classifyCustomerLookup,
  normalizeContactForSubmit,
  type ManualOrderContactForm,
} from "../customer-identity";

const typedForm: ManualOrderContactForm = {
  name: "Alice Old",
  email: "old@example.com",
  company: "Old Co",
  phone: "306-111-1111",
};

const blankForm: ManualOrderContactForm = {
  name: "",
  email: "old@example.com",
  company: "",
  phone: "",
};

describe("staff manual-order customer identity harness", () => {
  it("explicit pick overwrites everything — intentional, even when blanks come back", () => {
    const next = applyPickedCustomer(typedForm, {
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

  it("ignores stale lookup responses when the form email has already moved on", () => {
    const action = classifyCustomerLookup(
      { ...typedForm, email: "latest@example.com" },
      "older@example.com",
      { exists: true, name: "Older Customer", company: "Older Co", phone: "306-333-3333" },
    );

    expect(action.kind).toBe("ignore_stale_email");
  });

  it("returns no_match when the lookup confirms no saved customer exists", () => {
    const action = classifyCustomerLookup(typedForm, "old@example.com", { exists: false });
    expect(action.kind).toBe("no_match");
  });

  it("offers the saved data on a blank form with NO conflicts — never autofills silently", () => {
    const action = classifyCustomerLookup(blankForm, "old@example.com", {
      exists: true,
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });

    expect(action.kind).toBe("offer");
    if (action.kind !== "offer") return;
    expect(action.saved).toEqual({
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });
    expect(action.conflicts).toEqual([]);
  });

  it("offers the saved data with conflicts marked when typed values diverge from saved", () => {
    const action = classifyCustomerLookup(typedForm, "old@example.com", {
      exists: true,
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });

    expect(action.kind).toBe("offer");
    if (action.kind !== "offer") return;
    expect(action.conflicts.sort()).toEqual(["company", "name", "phone"]);
  });

  it("marks only the specific diverging fields as conflicts (single-field divergence)", () => {
    const oneConflict: ManualOrderContactForm = {
      name: "Bob New",
      email: "old@example.com",
      company: "Wrong Co",
      phone: "306-222-2222",
    };

    const action = classifyCustomerLookup(oneConflict, "old@example.com", {
      exists: true,
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });

    expect(action.kind).toBe("offer");
    if (action.kind !== "offer") return;
    expect(action.conflicts).toEqual(["company"]);
  });

  it("treats whitespace-only typed values as blank when computing conflicts", () => {
    const spaced: ManualOrderContactForm = {
      name: "Bob New",
      email: "old@example.com",
      company: "   ",
      phone: "",
    };

    const action = classifyCustomerLookup(spaced, "old@example.com", {
      exists: true,
      name: "Bob New",
      company: "New Co",
      phone: "306-222-2222",
    });

    expect(action.kind).toBe("offer");
    if (action.kind !== "offer") return;
    expect(action.conflicts).toEqual([]);
  });

  it("normalizes submit contact: trims, lowercases email, empty strings → undefined", () => {
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
