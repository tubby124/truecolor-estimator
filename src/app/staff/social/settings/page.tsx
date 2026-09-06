import type { Metadata } from "next";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireSocialBusiness, DEFAULT_SOCIAL_BUSINESS_ID } from "@/lib/social/business";
import GbpPanel from "./GbpPanel";
export const metadata: Metadata = { title: "Settings — Social Studio — True Color", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const auth = await requireSocialBusiness();
  if (auth instanceof NextResponse) redirect("/staff/login");
  const metaConfigured = auth.businessId === DEFAULT_SOCIAL_BUSINESS_ID && !!process.env.META_PAGE_ID && !!process.env.META_IG_USER_ID && !!process.env.META_PAGE_ACCESS_TOKEN;
  const generatorConfigured = !!process.env.OPENROUTER_API_KEY;
  return <div className="min-h-screen bg-[#f8f8f8] px-6 py-8"><div className="max-w-3xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-bold text-[#1c1712]">Social connections</h1><p className="text-sm text-gray-600 mt-2">Review connection health and actual Google posts before preparing new offers.</p></header>
    <section className="bg-white rounded-xl border p-6 space-y-3"><h2 className="font-bold">Instagram and Facebook</h2><p className="text-sm">Direct Meta transport: {metaConfigured ? "credentials configured" : "credentials not configured for this business"}.</p><p className="text-xs text-gray-600">Configuration alone does not prove live permission or delivery. Existing approval and publishing controls still apply.</p></section>
    <GbpPanel businessId={auth.businessId} />
    <section className="bg-white rounded-xl border p-6 space-y-3"><h2 className="font-bold">Caption generation</h2><p className="text-sm">OpenRouter: {generatorConfigured ? "configured" : "not configured"}.</p><p className="text-xs text-gray-600">Generation prepares editable drafts. Scheduled publication uses approved content and makes no AI call.</p></section>
  </div></div>;
}
