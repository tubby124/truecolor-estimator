#!/bin/bash
# SEO Sprint Log Enforcer
# Fires after every Edit/Write tool call.
# If the edited file is SEO-relevant, reminds Claude to update seo-sprints.md.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Bail immediately if no file path (e.g., Write without a path)
[ -z "$FILE_PATH" ] && exit 0

# SEO-relevant file patterns
SEO_PATTERNS=(
  "src/app/sitemap.ts"
  "src/app/layout.tsx"
  "next.config.ts"
  "src/components/site/IndustryPage.tsx"
  "src/components/site/SiteNav.tsx"
  "src/components/site/SiteFooter.tsx"
)

# Also match any page under src/app/ (new or updated SEO pages)
if [[ "$FILE_PATH" =~ /src/app/[a-z] ]] || [[ "$FILE_PATH" =~ /src/app/\[ ]]; then
  MATCH=1
fi

for PATTERN in "${SEO_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$PATTERN"* ]]; then
    MATCH=1
    break
  fi
done

if [ "${MATCH}" = "1" ]; then
  echo ""
  echo "=== SEO SPRINT LOG REQUIRED ==="
  echo "File edited: $FILE_PATH"
  echo ""
  echo "You MUST update seo-sprints.md before ending this session:"
  echo "  ~/.claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md"
  echo ""
  echo "Append a new ## SEO Phase [N] entry covering:"
  echo "  - Files changed"
  echo "  - What shipped"
  echo "  - What was deferred/flagged (with reason)"
  echo "  - Next steps / trigger date"
  echo "================================"
  echo ""
fi

exit 0
