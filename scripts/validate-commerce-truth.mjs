#!/usr/bin/env node
// Blocks future publication from scheduled data that still contains operational
// claims superseded by the commerce policy. It deliberately does not rewrite
// historical copy or publish anything.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const targets = [
  "src/lib/data/gbp-products.json",
  "src/lib/data/social-schedule.json",
];
const banned = [
  /Roland\s+UV\s+(?:printer|print)/i,
  /(?:ready in|standard)\s+48[- ]hour/i,
  /shipping across\s+(?:SK|Saskatchewan)/i,
  /order before 10\s*(?:AM|a\.m\.)[^\n]{0,80}(?:pickup|same.day)/i,
  /same.day rush[^\n]{0,80}(?:available|open)/i,
];

const failures = [];
for (const target of targets) {
  const text = readFileSync(resolve(process.cwd(), target), "utf8");
  for (const pattern of banned) {
    if (pattern.test(text)) failures.push(`${target}: blocked stale operational claim (${pattern})`);
  }
}

if (failures.length) {
  console.error("Commerce truth validation blocked scheduled outbound data:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("commerce truth validation passed");
}
