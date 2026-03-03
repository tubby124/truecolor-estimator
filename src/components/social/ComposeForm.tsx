"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { CaptionRewriter } from "./CaptionRewriter";
import { CAMPAIGN_HASHTAGS, CAMPAIGN_COLORS, getSuggestedScheduleDate } from "@/lib/data/social-hashtags";
import type { SocialCampaign, Platform, PostType } from "@/lib/types/social";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const PLATFORMS: { key: Platform; icon: string; label: string }[] = [
  { key: "instagram", icon: "📸", label: "Instagram" },
  { key: "facebook", icon: "🌐", label: "Facebook" },
  { key: "twitter", icon: "🐦", label: "X/Twitter" },
];

const POST_TYPES: { key: PostType; label: string; desc: string }[] = [
  { key: "launch", label: "Launch", desc: "14 days before event" },
  { key: "mid", label: "Mid", desc: "7 days before event" },
  { key: "last-call", label: "Last Call", desc: "4 days before event" },
];

function getAutoImageUrl(slug: string, postType: PostType) {
  const folder = slug.replace(/-2026$/, "");
  const map: Record<PostType, string> = {
    launch: "banner-traditional.png",
    mid: "banner-modern.png",
    "last-call": "email-header-main.png",
  };
  return `https://truecolorprinting.ca/images/seasonal/${folder}/${map[postType]}`;
}

function getHashtagSuggestion(slug: string) {
  const tpl = CAMPAIGN_HASHTAGS[slug];
  if (!tpl) return "#Saskatoon #PrintShop #VinylBanners #CustomSigns #WideFormatPrint";
  const all = [...tpl.local, ...tpl.product, ...tpl.seasonal.slice(0, 5), ...tpl.audience];
  return all.slice(0, 15).join(" ");
}

interface Props {
  campaigns: SocialCampaign[];
}

type Step = 1 | 2 | 3 | 4 | 5;

export function ComposeForm({ campaigns }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, showToast, dismissToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [campaignId, setCampaignId] = useState(
    () => campaigns.find(c => c.slug === searchParams.get("campaign"))?.id ?? ""
  );
  const [postType, setPostType] = useState<PostType>("launch");
  const [postNumber, setPostNumber] = useState(1);

  // Step 2
  const [captionRaw, setCaptionRaw] = useState("");
  const [captionInstagram, setCaptionInstagram] = useState("");
  const [captionFacebook, setCaptionFacebook] = useState("");
  const [captionTwitter, setCaptionTwitter] = useState("");

  // Step 3
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [hashtags, setHashtags] = useState("");

  // Step 4
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "facebook"]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("16:00");
  const [useNextFreeSlot, setUseNextFreeSlot] = useState(false);

  // Auto-fill when campaign + postType changes
  const campaign = campaigns.find(c => c.id === campaignId);
  useEffect(() => {
    if (!campaign) return;
    setImageUrl(getAutoImageUrl(campaign.slug, postType));
    setHashtags(getHashtagSuggestion(campaign.slug));
    if (campaign.event_date) {
      setScheduleDate(getSuggestedScheduleDate(campaign.event_date, postType));
    }
  }, [campaign, postType]);

  function togglePlatform(p: Platform) {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  async function handleSave(status: "draft" | "ready") {
    if (!captionRaw.trim() && !captionInstagram.trim()) {
      showToast("Write a caption or generate one with AI first", "error");
      return;
    }
    setSaving(true);
    try {
      const scheduleTimestamp = scheduleDate && !useNextFreeSlot
        ? `${scheduleDate}T${scheduleTime}:00`
        : null;

      const body = {
        campaign_id: campaignId || null,
        caption_raw: captionRaw,
        caption_instagram: captionInstagram || null,
        caption_facebook: captionFacebook || null,
        caption_twitter: captionTwitter || null,
        hashtags: hashtags || null,
        image_url: imageUrl || null,
        platforms,
        schedule_time: scheduleTimestamp,
        use_next_free_slot: useNextFreeSlot,
        status,
        post_type: postType,
        post_number: postNumber,
      };

      const res = await fetch("/api/staff/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }

      showToast(status === "ready" ? "Post marked ready!" : "Post saved as draft!", "success");
      setTimeout(() => router.push("/staff/social/queue"), 1200);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const STEPS = ["Campaign", "Caption", "Image", "Schedule", "Preview"];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">Compose Post</h1>
            <p className="text-sm text-gray-400 mt-0.5">Step {step} of 5 — {STEPS[step - 1]}</p>
          </div>
          <button
            onClick={() => router.push("/staff/social/queue")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex">
            {STEPS.map((label, i) => {
              const s = (i + 1) as Step;
              const done = s < step;
              const active = s === step;
              return (
                <button
                  key={label}
                  onClick={() => s < step && setStep(s)}
                  className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                    active ? "border-[#e63020] text-[#e63020]" : done ? "border-green-400 text-green-600 cursor-pointer hover:border-green-500" : "border-transparent text-gray-300"
                  }`}
                >
                  {done ? "✓ " : ""}{label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepCard key="1" title="Campaign & Post Type">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-2">Campaign</label>
                  <select
                    value={campaignId}
                    onChange={e => setCampaignId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                  >
                    <option value="">— No campaign —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {campaign && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CAMPAIGN_COLORS[campaign.slug] ?? "#6b7280" }} />
                      {campaign.event_date && `Event: ${new Date(campaign.event_date + "T00:00:00").toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-2">Post Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {POST_TYPES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setPostType(t.key)}
                        className={`rounded-xl border-2 p-3 text-left transition-all ${postType === t.key ? "border-[#e63020] bg-[#e63020]/5" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <p className="text-sm font-bold text-[#1c1712]">{t.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-2">Post # (this campaign)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => setPostNumber(n)}
                        className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${postNumber === n ? "border-[#e63020] text-[#e63020] bg-[#e63020]/5" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard key="2" title="Caption & AI Rewrite">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-1">
                    Notes / raw caption <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Add notes or a rough caption — OR skip this and drop a photo below. AI will figure it out.</p>
                  <textarea
                    value={captionRaw}
                    onChange={e => setCaptionRaw(e.target.value)}
                    rows={3}
                    placeholder="e.g. 2×4ft vinyl banner, green, for the St. Patrick's Day promo — $66"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
                  />
                </div>
                <CaptionRewriter
                  captionRaw={captionRaw}
                  campaignSlug={campaign?.slug}
                  onResult={(r) => {
                    setCaptionInstagram(r.instagram);
                    setCaptionFacebook(r.facebook);
                    setCaptionTwitter(r.twitter);
                    // Auto-fill hashtags from AI when provided
                    if (r.hashtags?.trim()) setHashtags(r.hashtags);
                  }}
                  onImageUploaded={(url) => {
                    setImageUrl(url);
                    setImageError(false);
                  }}
                />
                {/* Manual override panels if AI not used */}
                {!captionInstagram && (
                  <div className="pt-2 space-y-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Or write per-platform manually:</p>
                    {[
                      { key: "instagram" as const, label: "📸 Instagram", value: captionInstagram, set: setCaptionInstagram, limit: 220 },
                      { key: "facebook" as const, label: "🌐 Facebook", value: captionFacebook, set: setCaptionFacebook, limit: 300 },
                      { key: "twitter" as const, label: "🐦 X/Twitter", value: captionTwitter, set: setCaptionTwitter, limit: 200 },
                    ].map(p => (
                      <div key={p.key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">{p.label}</label>
                          <span className="text-xs text-gray-400 font-mono">{p.value.length}/{p.limit}</span>
                        </div>
                        <textarea
                          value={p.value}
                          onChange={e => p.set(e.target.value)}
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard key="3" title="Image & Hashtags">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-2">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => { setImageUrl(e.target.value); setImageError(false); }}
                    placeholder="https://truecolorprinting.ca/images/seasonal/..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                  />
                  {imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-32">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Post preview"
                        className={`max-h-48 max-w-full object-contain ${imageError ? "hidden" : ""}`}
                        onError={() => setImageError(true)}
                      />
                      {imageError && (
                        <div className="p-6 text-center">
                          <p className="text-4xl mb-2">🖼️</p>
                          <p className="text-sm text-gray-400">Image not found at this URL</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-1">Hashtags</label>
                  <p className="text-xs text-gray-400 mb-2">Paste these in the first comment after posting on Instagram (not in the caption)</p>
                  <textarea
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">{hashtags.split(" ").filter(Boolean).length} hashtags</p>
                </div>
              </div>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard key="4" title="Schedule & Platforms">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1c1712] mb-3">Platforms</label>
                  <div className="flex gap-3 flex-wrap">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => togglePlatform(p.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${platforms.includes(p.key) ? "border-[#1c1712] bg-[#1c1712] text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <span>{p.icon}</span> {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-[#1c1712]">Schedule</label>
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useNextFreeSlot}
                        onChange={e => setUseNextFreeSlot(e.target.checked)}
                        className="accent-[#e63020]"
                      />
                      Use next free slot
                    </label>
                  </div>

                  {!useNextFreeSlot && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Time (local)</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={e => setScheduleTime(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                        />
                      </div>
                    </div>
                  )}
                  {scheduleDate && !useNextFreeSlot && (
                    <p className="text-xs text-gray-400 mt-2">
                      Scheduled: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              </div>
            </StepCard>
          )}

          {step === 5 && (
            <StepCard key="5" title="Preview & Save">
              <div className="space-y-5">
                {/* IG preview card */}
                {platforms.includes("instagram") && captionInstagram && (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E1306C] to-[#833AB4] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">TC</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1c1712]">truecolorprinting</p>
                        <p className="text-xs text-gray-400">📍 Saskatoon, SK</p>
                      </div>
                    </div>
                    {imageUrl && !imageError && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="w-full object-cover max-h-64" onError={() => setImageError(true)} />
                    )}
                    <div className="px-4 py-3">
                      <p className="text-sm text-[#1c1712] leading-relaxed">{captionInstagram}</p>
                      <p className="text-xs text-blue-500 mt-2 leading-relaxed">{hashtags}</p>
                    </div>
                    <div className="flex items-center gap-5 px-4 py-2.5 border-t border-gray-100 text-gray-400">
                      <span className="text-lg">❤️</span>
                      <span className="text-lg">💬</span>
                      <span className="text-lg">✈️</span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  {[
                    ["Campaign", campaign?.name ?? "None"],
                    ["Post type", `${postType} #${postNumber}`],
                    ["Platforms", platforms.join(", ") || "None selected"],
                    ["Schedule", useNextFreeSlot ? "Next free slot" : scheduleDate ? `${scheduleDate} @ ${scheduleTime}` : "Not scheduled"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-gray-400">{k}</span>
                      <span className="text-[#1c1712] font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave("draft")}
                    disabled={saving}
                    className="flex-1 border-2 border-gray-200 text-[#1c1712] text-sm font-bold py-3 rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleSave("ready")}
                    disabled={saving || platforms.length === 0}
                    className="flex-1 bg-[#e63020] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#c8281a] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "✓ Mark Ready"}
                  </button>
                </div>
              </div>
            </StepCard>
          )}
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => (s > 1 ? (s - 1) as Step : s))}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1c1712] transition-colors disabled:opacity-30"
          >
            ← Back
          </button>
          {step < 5 && (
            <button
              onClick={() => setStep(s => (s < 5 ? (s + 1) as Step : s))}
              className="flex items-center gap-1.5 text-sm font-bold bg-[#1c1712] text-white px-6 py-2.5 rounded-xl hover:bg-black transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-[#1c1712]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}
