import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), service: vi.fn(), list: vi.fn(), url: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth, createServiceClient: mocks.service }));
import { GET } from "../route";
const file = (name: string, created_at = "2026-01-01T00:00:00Z") => ({ id: name, name, created_at });
describe("legacy uploaded images inventory", () => {
  beforeEach(() => {
    vi.resetAllMocks(); mocks.auth.mockResolvedValue({});
    mocks.service.mockReturnValue({ storage: { from: () => ({ list: mocks.list, getPublicUrl: mocks.url }) } });
    mocks.url.mockImplementation(path => ({ data: { publicUrl: `https://storage.example/${path}` } }));
  });
  it.each([401, 403])("requires staff (%s)", async status => { mocks.auth.mockResolvedValue(NextResponse.json({ error: "Denied" }, { status })); expect((await GET()).status).toBe(status); expect(mocks.service).not.toHaveBeenCalled(); });
  it("lists direct legacy files and year folders, ignoring null-ID placeholders", async () => {
    mocks.list.mockResolvedValueOnce({ data: [file("old.jpg"), { id: null, name: "2026" }, { id: null, name: "other" }, { id: null, name: ".emptyFolderPlaceholder" }] }).mockResolvedValueOnce({ data: [file("new.jpg", "2026-09-06T00:00:00Z")] });
    const response = await GET(); const body = await response.json();
    expect(body.images.map((a: { url: string }) => a.url)).toEqual(["https://storage.example/social/2026/new.jpg", "https://storage.example/social/old.jpg"]);
    expect(body.truncated).toBe(false); expect(mocks.list).toHaveBeenCalledTimes(2); expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("paginates a full page before reporting completion", async () => { mocks.list.mockResolvedValueOnce({ data: Array.from({ length: 200 }, (_, n) => file(`${n}.jpg`)) }).mockResolvedValueOnce({ data: [file("last.jpg")] }); const body = await (await GET()).json(); expect(body.images).toHaveLength(201); expect(mocks.list.mock.calls[1][1].offset).toBe(200); expect(body.truncated).toBe(false); });
  it("fails explicitly when a later folder cannot be read, without partial images", async () => { mocks.list.mockResolvedValueOnce({ data: [file("old.jpg"), { id: null, name: "2026" }] }).mockResolvedValueOnce({ error: { message: "private internals" } }); const response = await GET(); const body = await response.json(); expect(response.status).toBe(503); expect(body.images).toBeUndefined(); expect(JSON.stringify(body)).not.toContain("private internals"); });
  it("caps image results with an explicit truncated indicator", async () => { mocks.list.mockResolvedValue({ data: Array.from({ length: 200 }, (_, n) => file(`${n}.jpg`)) }); const body = await (await GET()).json(); expect(body.images).toHaveLength(5000); expect(body.truncated).toBe(true); expect(mocks.list).toHaveBeenCalledTimes(25); });
  it("caps list calls even when pages contain no images", async () => { mocks.list.mockResolvedValue({ data: Array.from({ length: 200 }, () => ({ id: null, name: "ignored" })) }); const body = await (await GET()).json(); expect(body.images).toHaveLength(0); expect(body.truncated).toBe(true); expect(mocks.list).toHaveBeenCalledTimes(50); });
});
