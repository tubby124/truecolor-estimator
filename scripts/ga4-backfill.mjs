#!/usr/bin/env node
// Retired unconditionally: historical orders must not be replayed into GA4.
// Keep this entry point inert, including --dry-run, --execute and unknown flags.
console.error("GA4 historical backfill is disabled. No orders were read and no events were sent.");
process.exitCode = 1;
