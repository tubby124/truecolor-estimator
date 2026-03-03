import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import type { CaptionRewriteBody, CaptionRewriteResponse } from "@/lib/types/social";
import {
  TC_VOICE_PROMPT,
  TC_GENERATE_FROM_IMAGE_PROMPT,
  TC_GENERATE_FROM_TOPIC_PROMPT,
} from "@/lib/data/social-hashtags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as CaptionRewriteBody;

  const hasCaption = !!body.caption_raw?.trim();
  const hasImage = !!body.image_base64?.trim();
  const hasTopic = !!body.topic?.trim();

  if (!hasCaption && !hasImage && !hasTopic) {
    return NextResponse.json(
      { error: "Provide a caption, upload an image, or enter a topic." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured. Add it in Railway environment variables." },
      { status: 503 }
    );
  }

  try {
    // Determine system prompt + user message based on mode
    let systemPrompt: string;
    let userContent: unknown;

    if (hasImage) {
      // Vision mode: analyze the uploaded image and generate captions
      systemPrompt = TC_GENERATE_FROM_IMAGE_PROMPT;
      const imageType = body.image_type ?? "image/jpeg";
      const imageUrl = `data:${imageType};base64,${body.image_base64}`;

      const contextNote = body.caption_raw?.trim()
        ? `\n\nAdditional context from staff: "${body.caption_raw.trim()}"`
        : "";

      userContent = [
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
        {
          type: "text",
          text: `Generate social media captions for this print job.${contextNote}`,
        },
      ];
    } else if (hasCaption) {
      // Rewrite mode: take the raw caption and adapt it for each platform
      systemPrompt = TC_VOICE_PROMPT;
      userContent = `Rewrite this caption for Instagram, Facebook, and X:\n\n${body.caption_raw}`;
    } else {
      // Topic/keyword mode: generate from scratch about a product or subject
      systemPrompt = TC_GENERATE_FROM_TOPIC_PROMPT;
      userContent = `Generate social media posts about: ${body.topic}`;
    }

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI generation failed: ${response.status}` },
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

    // Strip markdown code blocks if Claude wrapped the JSON
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const captions = JSON.parse(cleaned) as CaptionRewriteResponse;

    if (!captions.instagram || !captions.facebook || !captions.twitter) {
      throw new Error("Incomplete response — missing platform captions");
    }

    return NextResponse.json(captions);
  } catch (err) {
    console.error("Caption generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Caption generation failed" },
      { status: 500 }
    );
  }
}
