import "server-only";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { META_MARKETING_CONSENT_COOKIE } from "@/lib/analytics/metaConsent";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "2456385404880011";
const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const CAPI_TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE;
const CAPI_GRAPH_VERSION = process.env.META_CAPI_GRAPH_VERSION ?? "v23.0";

const SHA = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export interface CapiUserData {
  email?: string;
  phone?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string;
}

export interface CapiEvent {
  event_name: "Purchase" | "Lead" | "AddToCart" | "InitiateCheckout" | "ViewContent";
  event_time?: number;
  event_id?: string;
  action_source?: "website" | "system_generated";
  event_source_url?: string;
  user_data: CapiUserData;
  custom_data?: Record<string, unknown>;
}

export interface MetaCapiRequestContext {
  marketingConsent: boolean;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  const value = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value && value.length <= 200 ? value : undefined;
}

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded && forwarded.length <= 64 ? forwarded : undefined;
}

export function getMetaCapiRequestContext(req: NextRequest): MetaCapiRequestContext {
  const cookieHeader = req.headers.get("cookie");
  const marketingConsent = readCookie(cookieHeader, META_MARKETING_CONSENT_COOKIE) === "granted";
  if (!marketingConsent) return { marketingConsent: false };

  return {
    marketingConsent,
    fbp: readCookie(cookieHeader, "_fbp"),
    fbc: readCookie(cookieHeader, "_fbc"),
    clientIp: getClientIp(req),
    clientUserAgent: req.headers.get("user-agent")?.slice(0, 500) || undefined,
  };
}

export async function sendMetaCapiEvent(event: CapiEvent): Promise<boolean> {
  if (!CAPI_TOKEN) {
    console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN not set — skipping", event.event_name);
    return false;
  }

  const userData: Record<string, unknown> = {};
  if (event.user_data.email) userData.em = [SHA(event.user_data.email)];
  if (event.user_data.phone) userData.ph = [SHA(event.user_data.phone.replace(/\D/g, ""))];
  if (event.user_data.external_id) userData.external_id = [SHA(event.user_data.external_id)];
  if (event.user_data.client_ip_address) userData.client_ip_address = event.user_data.client_ip_address;
  if (event.user_data.client_user_agent) userData.client_user_agent = event.user_data.client_user_agent;
  if (event.user_data.fbp) userData.fbp = event.user_data.fbp;
  if (event.user_data.fbc) userData.fbc = event.user_data.fbc;

  const payload: Record<string, unknown> = {
    data: [{
      event_name: event.event_name,
      event_time: event.event_time ?? Math.floor(Date.now() / 1000),
      event_id: event.event_id,
      action_source: event.action_source ?? "website",
      event_source_url: event.event_source_url ?? "https://truecolorprinting.ca",
      user_data: userData,
      custom_data: event.custom_data ?? {},
    }],
  };
  if (CAPI_TEST_CODE) payload.test_event_code = CAPI_TEST_CODE;

  const url = `https://graph.facebook.com/${CAPI_GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`[meta-capi] ${response.status} ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[meta-capi] fetch failed:", error);
    return false;
  }
}
