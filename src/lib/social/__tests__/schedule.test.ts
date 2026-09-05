import { describe, expect, it } from "vitest";
import { reginaDate, reginaToIso, weeklySchedule } from "../schedule";

describe("Regina weekly planning", () => {
  it("uses business date across UTC midnight", () => {
    expect(reginaDate(new Date("2026-09-06T02:00:00Z"))).toBe("2026-09-05");
  });
  it("spreads weekly across year and leap-day boundaries", () => {
    expect(weeklySchedule("2027-12-28", 2, "15:00")).toEqual(["2027-12-28T15:00:00", "2028-01-04T15:00:00"]);
    expect(weeklySchedule("2028-02-22", 2, "15:00")[1]).toBe("2028-02-29T15:00:00");
  });
  it("does not apply the browser's daylight saving offset", () => {
    expect(reginaToIso("2026-07-01T15:00:00")).toBe("2026-07-01T21:00:00.000Z");
    expect(reginaToIso("2026-12-01T15:00")).toBe("2026-12-01T21:00:00.000Z");
  });
  it("rejects malformed and impossible wall times", () => {
    expect(weeklySchedule("2026-02-30", 2, "15:00")).toEqual([]);
    expect(() => reginaToIso("2026-09-05T25:30")).toThrow();
    expect(() => reginaToIso("2026-09-05T15:00Z")).toThrow();
  });
});
