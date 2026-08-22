import { describe, expect, it } from "vitest";
import { collectOrderAssetPaths } from "../order-assets";

describe("collectOrderAssetPaths", () => {
  it("keeps every order-level path and adds legacy item paths without duplicates", () => {
    expect(collectOrderAssetPaths({
      file_storage_paths: ["uploads/original.pdf", "uploads/mockup.png"],
      order_items: [
        { file_storage_path: "uploads/original.pdf" },
        { file_storage_path: "uploads/legacy.ai" },
      ],
    })).toEqual([
      "uploads/original.pdf",
      "uploads/mockup.png",
      "uploads/legacy.ai",
    ]);
  });

  it("keeps every proof path while supporting the legacy single-proof field", () => {
    expect(collectOrderAssetPaths({
      proof_storage_paths: ["proofs/one.png", "proofs/two.pdf"],
      proof_storage_path: "proofs/two.pdf",
    }, "proof")).toEqual(["proofs/one.png", "proofs/two.pdf"]);
  });
});
