import { test, expect, type Page } from "@playwright/test";

const cacheKey = "tc_ga4_context:v1:G-6HMQT7MNLL";
async function isolate(page: Page, baseURL: string | undefined, missingClient = false) {
  if (!baseURL || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname)) {
    throw new Error("Synthetic GA4 contracts require a loopback app");
  }
  const origin = new URL(baseURL).origin;
  await page.route("**/*", route => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin) return route.abort();
    if (request.method() !== "GET" && request.method() !== "HEAD") {
      return route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"Synthetic browser contract: all writes blocked"}' });
    }
    return route.continue();
  });
  await page.addInitScript(({ cacheKey, missingClient }) => {
    const reads: string[] = [];
    Object.defineProperty(window, "__gaReads", { value: reads });
    const stub = (command: string, destination: string, field: string, callback: (v: unknown) => void) => {
      if (command !== "get") return;
      reads.push(`${destination}:${field}`);
      const values: Record<string, string> = { client_id: "123.456", session_id: "789", session_number: "2" };
      if (missingClient && field === "client_id") return;
      setTimeout(() => callback(values[field]), (window as unknown as { __gaDelay?: number }).__gaDelay ?? 800);
    };
    Object.defineProperty(window, "gtag", { configurable: false, get: () => stub, set: () => {} });
    sessionStorage.setItem(cacheKey, JSON.stringify({ capturedAt: Date.now(), context: { ga_client_id: "123.456", ga_session_id: "700", ga_session_number: "1" } }));
  }, { cacheKey, missingClient });
}

test("public route primes delayed supported GA4 reads", async ({ page, baseURL }) => {
  await isolate(page, baseURL);
  await page.goto("/products");
  await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? "null")?.context.ga_session_id, cacheKey)).toBe("789");
  expect(await page.evaluate(() => (window as unknown as { __gaReads: string[] }).__gaReads)).toContain("G-6HMQT7MNLL:client_id");
});

test("absent live client cannot retain a cached identity", async ({ page, baseURL }) => {
  await isolate(page, baseURL, true);
  await page.goto("/products");
  await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), cacheKey), { timeout: 10_000 }).toBeNull();
});

test("payment route purges cached identifiers without gtag reads", async ({ page, baseURL }) => {
  await isolate(page, baseURL);
  await page.goto("/pay/synthetic-invalid-token");
  await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), cacheKey)).toBeNull();
  expect(await page.evaluate(() => (window as unknown as { __gaReads: string[] }).__gaReads)).toEqual([]);
});

for (const missingClient of [false, true]) {
  test(`checkout request ${missingClient ? "omits context without live client" : "retains supported context"}`, async ({ page, baseURL }) => {
    await isolate(page, baseURL, missingClient);
    await page.goto("/products");
    await page.evaluate(() => {
      sessionStorage.setItem("tc_cart", JSON.stringify([{
        id: "synthetic-ga4-item", product_name: "Coroplast Signs", product_slug: "coroplast-signs",
        category: "SIGN", label: "18×24 Coroplast Sign — 1-sided × 1",
        config: { category: "SIGN", width_in: 18, height_in: 24, sides: 1, qty: 1, material_code: "CORO-4MM", design_status: "PRINT_READY", addons: [] },
        sell_price: 25, gst_rate: 0.05, qty: 1,
      }]));
    });
    await page.goto("/checkout");
    await expect.poll(() => page.evaluate(key => {
      const stored = JSON.parse(sessionStorage.getItem(key) ?? "null");
      return stored?.context.ga_session_id ?? null;
    }, cacheKey), { timeout: 10_000 }).toBe(missingClient ? null : "789");
    await page.evaluate(({ cacheKey, missingClient }) => {
      (window as unknown as { __gaDelay: number }).__gaDelay = 20;
      if (missingClient) sessionStorage.setItem(cacheKey, JSON.stringify({ capturedAt: Date.now() - 120_000, context: { ga_client_id: "999.888", ga_session_id: "700", ga_session_number: "1" } }));
    }, { cacheKey, missingClient });
    await page.getByLabel("Name *").fill("Synthetic Contract");
    await page.getByLabel("Email *").fill("ga4-contract@example.test");
    const requestPromise = page.waitForRequest(request => new URL(request.url()).pathname === "/api/orders" && request.method() === "POST");
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    const body = (await requestPromise).postDataJSON();
    expect(body.contact.email).toBe("ga4-contract@example.test");
    if (missingClient) {
      for (const field of ["ga_client_id", "ga_session_id", "ga_session_number"]) expect(body).not.toHaveProperty(field);
    } else {
      expect(body).toMatchObject({ ga_client_id: "123.456", ga_session_id: "789", ga_session_number: "2" });
    }
  });
}
