import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const scriptPath = fileURLToPath(new URL("./seo-opportunities.mjs", import.meta.url));

function runWithMockedSnapshots() {
  const bootstrap = `
    const queries = [];
    globalThis.fetch = async (_url, options) => {
      const query = JSON.parse(options.body).query;
      queries.push(query);
      const isDecayQuery = query.includes("WITH recent AS");
      const rows = isDecayQuery ? [] : [{
        query: "print shop saskatoon",
        page: "https://truecolorprinting.ca/",
        impressions: 100,
        clicks: 0,
        position: 4,
        ctr: 0,
      }];
      return new Response(JSON.stringify(rows), { status: 200 });
    };
    await import(${JSON.stringify(scriptPath)});
    process.stderr.write("TEST_SQL:" + Buffer.from(JSON.stringify(queries)).toString("base64") + "\\n");
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", bootstrap], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: "test-token" },
    encoding: "utf8",
  });

  expect(result.status, result.stderr).toBe(0);
  const sqlLine = result.stderr.split("\n").find((line) => line.startsWith("TEST_SQL:"));
  expect(sqlLine, "mock runner did not capture SQL").toBeTruthy();
  return {
    output: JSON.parse(result.stdout),
    queries: JSON.parse(Buffer.from(sqlLine.slice("TEST_SQL:".length), "base64").toString("utf8")),
  };
}

test("anchors every opportunity and decay window to the latest finalized snapshot", () => {
  const { queries } = runWithMockedSnapshots();

  expect(queries).toHaveLength(2);
  for (const query of queries) {
    expect(query).toMatch(/MAX\(snapshot_date\)/);
    expect(query).not.toMatch(/CURRENT_DATE/);
  }
  expect(queries[0]).toMatch(/snapshot_date >= \(SELECT MAX\(snapshot_date\) FROM seo_gsc_snapshots\) - INTERVAL '27 days'/);
  expect(queries[1]).toMatch(/recent[\s\S]*snapshot_date >= \(SELECT MAX\(snapshot_date\) FROM seo_gsc_snapshots\) - INTERVAL '13 days'/);
  expect(queries[1]).toMatch(/prior[\s\S]*snapshot_date >= \(SELECT MAX\(snapshot_date\) FROM seo_gsc_snapshots\) - INTERVAL '27 days'[\s\S]*snapshot_date < \(SELECT MAX\(snapshot_date\) FROM seo_gsc_snapshots\) - INTERVAL '13 days'/);
});

test("preserves the homepage when it is a low-CTR title candidate", () => {
  const { output } = runWithMockedSnapshots();
  const homepage = output.title_rewrite_candidates.find((candidate) => candidate.page.endsWith("/"));

  expect({ frozen: homepage?.frozen, action: homepage?.action, command: homepage?.command }).toEqual({
    frozen: true,
    action: "skip-frozen",
    command: "# FROZEN: do not touch https://truecolorprinting.ca/ title (per seo-protected-pages.md)",
  });
});
