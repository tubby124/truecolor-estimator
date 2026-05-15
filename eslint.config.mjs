import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noVoidSupabaseBuilder from "./.eslint-rules/no-void-supabase-builder.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project-local rules (prevents recurring silent-data-loss bugs).
  // See ~/Downloads/Obsidian Vault/Projects/true-color/2026-05-15-void-supabase-bug-audit.md
  {
    plugins: {
      "tc-local": {
        rules: {
          "no-void-supabase-builder": noVoidSupabaseBuilder,
        },
      },
    },
    rules: {
      "tc-local/no-void-supabase-builder": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
