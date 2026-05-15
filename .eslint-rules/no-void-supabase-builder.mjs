/**
 * Custom ESLint rule: `no-void-supabase-builder`
 *
 * Blocks the pattern `void supabase.from(...).update(...).eq(...)` (and similar)
 * which silently drops the HTTP request because Supabase JS V2's
 * PostgrestFilterBuilder is thenable but does NOT auto-execute. The `void`
 * operator just discards the builder without calling `.then()` — so the request
 * never fires.
 *
 * This rule fires on:
 *   void supabase.from("X").update(...).eq(...)
 *   void supabase.from("X").insert(...)
 *   void supabase.from("X").upsert(...)
 *   void supabase.from("X").delete().eq(...)
 *   void supabase.from("X").select().eq(...)
 *
 * It does NOT fire on:
 *   void supabase.removeChannel(channel)       — synchronous teardown
 *   void supabase.auth.signOut()               — explicit Promise, auto-fires
 *   void (async () => { await supabase... })() — async IIFE pattern, body runs
 *   void supabase.from(...).then((res) => ...) — explicit .then() triggers fire
 *
 * Background: bug found 2026-05-15 caused 30+ days of silent Wave + Clover
 * bookkeeping desync at True Color. See vault audit:
 *   ~/Downloads/Obsidian Vault/Projects/true-color/2026-05-15-void-supabase-bug-audit.md
 */

const BUILDER_METHODS = new Set(["update", "insert", "upsert", "delete", "select"]);
const FROM_METHOD = "from";

function findRootCalleeIdentifier(node) {
  // Walk a chain of CallExpression/MemberExpression to find the root variable name.
  // E.g. supabase.from("X").update(...).eq(...) → "supabase"
  let cur = node;
  while (cur) {
    if (cur.type === "Identifier") return cur.name;
    if (cur.type === "MemberExpression") cur = cur.object;
    else if (cur.type === "CallExpression") cur = cur.callee;
    else return null;
  }
  return null;
}

function chainIncludesBuilderMethod(node) {
  // Check if the call chain includes from() then a builder method
  let cur = node;
  let sawFrom = false;
  let sawBuilder = false;
  let sawThen = false;
  while (cur) {
    if (cur.type === "CallExpression") {
      const callee = cur.callee;
      if (callee?.type === "MemberExpression" && callee.property?.type === "Identifier") {
        const name = callee.property.name;
        if (name === "then") sawThen = true;
        if (name === FROM_METHOD) sawFrom = true;
        if (BUILDER_METHODS.has(name)) sawBuilder = true;
        cur = callee.object;
        continue;
      }
      cur = cur.callee;
    } else if (cur.type === "MemberExpression") {
      cur = cur.object;
    } else {
      break;
    }
  }
  return { sawFrom, sawBuilder, sawThen };
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `void` on Supabase PostgrestFilterBuilder — it does NOT fire the HTTP request",
      recommended: true,
    },
    schema: [],
    messages: {
      brokenVoid:
        "`void` on a Supabase builder does NOT fire the request — PostgrestFilterBuilder is thenable, not a Promise. Use `await ... ` and destructure `{ error }`, or chain `.then((res) => ...)`. See ~/Downloads/Obsidian Vault/Projects/true-color/2026-05-15-void-supabase-bug-audit.md",
    },
  },

  create(context) {
    return {
      "UnaryExpression[operator='void']"(node) {
        const arg = node.argument;
        if (!arg || (arg.type !== "CallExpression" && arg.type !== "MemberExpression")) return;

        const rootName = findRootCalleeIdentifier(arg);
        // Match `supabase.*` or aliases that contain "supabase" / "Supabase"
        if (!rootName || !/supabase/i.test(rootName)) return;

        const { sawFrom, sawBuilder, sawThen } = chainIncludesBuilderMethod(arg);

        // Skip if explicit .then() — that DOES fire the request
        if (sawThen) return;

        // Only flag if the chain includes from(...).<builder>(...) pattern
        if (sawFrom && sawBuilder) {
          context.report({ node, messageId: "brokenVoid" });
        }
      },
    };
  },
};
