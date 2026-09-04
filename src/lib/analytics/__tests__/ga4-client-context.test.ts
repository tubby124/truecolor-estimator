import { describe, expect, it } from "vitest";
import { parseGa4ClientContext } from "../ga4-client-context";

describe("GA4 browser context validation", () => {
  it("keeps only real GA client and numeric session identifiers", () => {
    expect(parseGa4ClientContext({
      ga_client_id: " 1234567890.1234567890 ",
      ga_session_id: 1234567890,
      ga_session_number: "2",
    })).toEqual({
      ga_client_id: "1234567890.1234567890",
      ga_session_id: "1234567890",
      ga_session_number: "2",
    });
  });

  it("rejects fabricated or malformed client identifiers", () => {
    expect(parseGa4ClientContext({ ga_client_id: "customer-123" })).toBeNull();
    expect(parseGa4ClientContext({ ga_client_id: "123.abc" })).toBeNull();
  });
});
