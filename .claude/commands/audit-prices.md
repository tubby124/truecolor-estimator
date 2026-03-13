# Full Pricing Audit

Run a complete pricing audit using 3 parallel subagents:

1. Launch subagent `csv-integrity-auditor` — cross-check all CSVs and engine
2. Launch subagent `landing-page-price-auditor` — scan all page.tsx files
3. Launch subagent `seo-content-price-auditor` — audit meta, FAQs, content rules

Run all 3 in parallel since they read different file sets with no conflicts.

When all 3 complete, synthesize findings into a single report:
- CRITICAL: Wrong prices customers would see
- HIGH: Drift between CSVs and pages
- MEDIUM: Style/format violations
- LOW: Minor inconsistencies

Include summary stats, files with most issues, products with most issues.

For any page with a ranking keyword, mark as 🔒 SEO-PROTECTED.

Save the report to data/audit-reports/pricing-audit-{YYYY-MM-DD}.md
