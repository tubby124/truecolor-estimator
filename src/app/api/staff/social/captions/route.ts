import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import type { CaptionRewriteBody, CaptionRewriteResponse } from "@/lib/types/social";
import { TC_VOICE_PROMPT } from "@/lib/data/social-hashtags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as CaptionRewriteBody;

  if (!body.caption_raw?.trim()) {
    return NextResponse.json({ error: "caption_raw is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured. Add it in Railway environment variables." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://truecolorprinting.ca",
        "X-Title": "True Color Social Studio",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          { role: "system", content: TC_VOICE_PROMPT },
          { role: "user", content: body.caption_raw },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI rewrite failed: ${response.status}` },
        { status: 502 }
      );
    }

    const result = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    // Parse the JSON response from Claude
    // Sometimes it wraps in markdown code blocks — strip them
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const captions = JSON.parse(cleaned) as CaptionRewriteResponse;

    if (!captions.instagram || !captions.facebook || !captions.twitter) {
      throw new Error("Incomplete response — missing platform captions");
    }

    return NextResponse.json(captions);
  } catch (err) {
    console.error("Caption rewrite error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Caption rewrite failed" },
      { status: 500 }
    );
  }
}
