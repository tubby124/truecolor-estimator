import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings — Social Studio — True Color",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function EnvStatus({ name, value }: { name: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#1c1712] font-mono">{name}</p>
      </div>
      <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${value ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${value ? "bg-green-500" : "bg-red-400"}`} />
        {value ? "Connected" : "Not set"}
      </span>
    </div>
  );
}

async function getAccountsFromDB() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)
      .order("platform");
    return data ?? [];
  } catch {
    return [];
  }
}

async function getCampaignCount() {
  try {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from("social_campaigns")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  facebook: "🌐",
  twitter: "🐦",
  tiktok: "🎵",
};

export default async function SettingsPage() {
  const [accounts, campaignCount] = await Promise.all([getAccountsFromDB(), getCampaignCount()]);

  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasBlotato = !!process.env.BLOTATO_API_KEY;
  const hasN8nSecret = !!process.env.N8N_WEBHOOK_SECRET;
  const hasSupabase = !!process.env.SUPABASE_SECRET_KEY;

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca"}/api/staff/social/webhooks/n8n`;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-[#1c1712]">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">API keys, integrations, webhook endpoints</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Database status */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#1c1712] mb-4">Database</h2>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-[#1c1712]">Campaigns in Supabase</p>
            <span className={`text-sm font-bold ${campaignCount > 0 ? "text-green-600" : "text-amber-500"}`}>
              {campaignCount > 0 ? `✓ ${campaignCount} campaigns` : "⚠️ 0 — run Phase 1 SQL"}
            </span>
          </div>
          {campaignCount === 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700 font-medium mb-1">Phase 1 SQL not yet run.</p>
              <p className="text-xs text-amber-600">Open Supabase → SQL Editor → paste the Phase 1 SQL from your plan file to create tables and seed 9 campaigns.</p>
            </div>
          )}
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#1c1712] mb-1">API Keys</h2>
          <p className="text-xs text-gray-400 mb-4">Set in Railway environment variables</p>
          <EnvStatus name="OPENROUTER_API_KEY" value={hasOpenRouter} />
          <EnvStatus name="BLOTATO_API_KEY" value={hasBlotato} />
          <EnvStatus name="N8N_WEBHOOK_SECRET" value={hasN8nSecret} />
          <EnvStatus name="SUPABASE_SECRET_KEY" value={hasSupabase} />
          {!hasOpenRouter && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700">
                Get your OpenRouter API key at <span className="font-mono font-bold">openrouter.ai</span> → Settings → API Keys. Add as <span className="font-mono">OPENROUTER_API_KEY</span> in Railway.
              </p>
            </div>
          )}
          {!hasBlotato && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600">
                Get your Blotato API key at <span className="font-mono font-bold">my.blotato.com</span> → Settings. Posting will be enabled once key is set.
              </p>
            </div>
          )}
        </div>

        {/* n8n webhook */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#1c1712] mb-1">n8n Webhook</h2>
          <p className="text-xs text-gray-400 mb-4">Paste this URL into your n8n HTTP Request node (POST after posting)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#1c1712] font-mono break-all">
              {webhookUrl}
            </code>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Set header <span className="font-mono font-semibold">x-n8n-secret</span> = value of your <span className="font-mono">N8N_WEBHOOK_SECRET</span> Railway var.
          </p>
        </div>

        {/* Connected accounts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1c1712]">Social Accounts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Connected via Blotato</p>
            </div>
            {hasBlotato && (
              <form action="/api/staff/social/accounts" method="GET">
                <button
                  type="submit"
                  className="text-xs font-semibold text-[#e63020] bg-[#e63020]/8 hover:bg-[#e63020]/15 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Refresh from Blotato
                </button>
              </form>
            )}
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🔌</p>
              <p className="text-sm text-gray-400">
                {hasBlotato
                  ? "No accounts synced yet. Click 'Refresh from Blotato'."
                  : "Set BLOTATO_API_KEY to sync your social accounts."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc: { id: string; platform: string; account_name: string | null; is_active: boolean }) => (
                <div key={acc.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-xl">{PLATFORM_ICONS[acc.platform] ?? "📣"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1c1712] capitalize">{acc.platform}</p>
                    {acc.account_name && <p className="text-xs text-gray-400">{acc.account_name}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${acc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {acc.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick reference */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#1c1712] mb-3">Quick Reference</h2>
          <div className="space-y-2 text-xs text-gray-500">
            <p>📍 <span className="font-semibold text-gray-700">True Color Display Printing</span> · 216 33rd St W, Saskatoon, SK S7L 0P5</p>
            <p>🌐 <span className="font-mono">truecolorprinting.ca</span></p>
            <p>📱 AI captions via OpenRouter → <span className="font-mono">anthropic/claude-sonnet-4-6</span></p>
            <p>📤 Social posting via Blotato (n8n community node: <span className="font-mono">n8n-nodes-blotato</span>)</p>
            <p>⚡ Realtime updates via Supabase postgres_changes on <span className="font-mono">social_posts</span> + <span className="font-mono">social_post_results</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
