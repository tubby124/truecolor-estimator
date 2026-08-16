import { NextRequest, NextResponse } from "next/server";
import { estimate } from "@/lib/engine";
import type { EstimateRequest } from "@/lib/engine/types";
import type { Addon, Category, DesignStatus, Finish } from "@/lib/data/types";

/**
 * Public, unauthenticated endpoint — the body is fully attacker-controlled, so
 * it is validated here rather than relying on the engine's two internal guards
 * (qty < 1 and dims <= 0 in sticker-v2-bridge.ts, which only cover STICKER).
 *
 * Bound sources — every number below traces to something already in the repo:
 *   MAX_DIMENSION_IN  480    src/lib/data/product-config.ts sqftControls()
 *                            width_in / height_in `max: 480`
 *   MAX_QTY           100000 abuse ceiling. The UI cap is 10000 (same file,
 *                            qty `max: 10000`) and the largest catalog preset is
 *                            5000, but the staff estimator has no client cap, so
 *                            a wider server bound avoids rejecting a real quote.
 *   MAX_STRING_LEN    64     longest material_code in data/tables is 24 chars.
 *
 * Dimensions accept 0. Flat-fee service SKUs (serviceMode products in
 * products-content.ts) post `width_in: 0, height_in: 0` from their "Flat fee"
 * size preset, and the engine already treats 0 as "no dimensions". Only
 * negative values are rejected.
 *
 * Unknown top-level keys are ignored, not rejected — clients add request fields
 * ahead of deploys (`shape` shipped that way). Known keys are type-checked
 * strictly, and only known keys are forwarded to the engine.
 */
const MAX_DIMENSION_IN = 480;
const MAX_QTY = 100_000;
const MAX_STRING_LEN = 64;
const MAX_ADDONS = 20;

/**
 * Allow-lists written as Record<Union, true> on purpose: the compiler requires
 * every union member as a key, so adding a value to Category / Addon / Finish /
 * DesignStatus in src/lib/data/types.ts fails type-check here until it is
 * allowed through explicitly. A Set<string> would silently drift.
 */
const CATEGORIES: Record<Category, true> = {
  SIGN: true, BANNER: true, RIGID: true, DISPLAY: true, STICKER: true,
  DECAL: true, VINYL_LETTERING: true, FOAMBOARD: true, PHOTO_POSTER: true,
  MAGNET: true, POSTCARD: true, BUSINESS_CARD: true, FLYER: true,
  BROCHURE: true, DESIGN: true, INSTALLATION: true, SERVICE: true,
  BOOKLET: true,
};

const DESIGN_STATUSES: Record<DesignStatus, true> = {
  PRINT_READY: true, MINOR_EDIT: true, FULL_DESIGN: true,
  LOGO_RECREATION: true, INCLUDED: true, UNKNOWN: true,
};

const FINISHES: Record<Finish, true> = {
  GLOSS_LAM: true, MATTE_LAM: true, HEMMED: true, DIE_CUT: true, NONE: true,
};

const ADDONS: Record<Addon, true> = {
  GROMMETS: true, H_STAKE: true, RUSH: true, DESIGN_MINOR: true,
  DESIGN_FULL: true, DESIGN_LOGO: true, INSTALLATION: true,
};

const SHAPES: Record<NonNullable<EstimateRequest["shape"]>, true> = {
  square: true, circle: true, die_cut: true,
};

function isAllowed<T extends string>(allowed: Record<T, true>, value: unknown): value is T {
  return typeof value === "string"
    && Object.prototype.hasOwnProperty.call(allowed, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ParseResult =
  | { ok: true; value: EstimateRequest }
  | { ok: false; message: string };

/**
 * Validates and narrows an untrusted JSON body into an EstimateRequest.
 * Absent and null are both treated as "not provided" for optional fields —
 * JSON.stringify drops undefined, so callers already omit unset values.
 */
function parseEstimateBody(raw: unknown): ParseResult {
  if (!isRecord(raw)) {
    return { ok: false, message: "Request body must be a JSON object" };
  }

  if (!isAllowed(CATEGORIES, raw.category)) {
    return { ok: false, message: "category is required and must be a known product category" };
  }
  const parsed: EstimateRequest = { category: raw.category };

  for (const key of ["width_in", "height_in"] as const) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, message: `${key} must be a finite number` };
    }
    if (value < 0 || value > MAX_DIMENSION_IN) {
      return { ok: false, message: `${key} must be between 0 and ${MAX_DIMENSION_IN} inches` };
    }
    parsed[key] = value;
  }

  if (raw.qty !== undefined && raw.qty !== null) {
    const qty = raw.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty)) {
      return { ok: false, message: "qty must be a whole number" };
    }
    if (qty < 1 || qty > MAX_QTY) {
      return { ok: false, message: `qty must be between 1 and ${MAX_QTY}` };
    }
    parsed.qty = qty;
  }

  if (raw.sides !== undefined && raw.sides !== null) {
    if (raw.sides !== 1 && raw.sides !== 2) {
      return { ok: false, message: "sides must be 1 or 2" };
    }
    parsed.sides = raw.sides;
  }

  for (const key of ["material_code", "pricing_version"] as const) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      return { ok: false, message: `${key} must be a string` };
    }
    if (value.length > MAX_STRING_LEN) {
      return { ok: false, message: `${key} must be ${MAX_STRING_LEN} characters or fewer` };
    }
    parsed[key] = value;
  }

  for (const key of ["is_rush", "skip_min_charge"] as const) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "boolean") {
      return { ok: false, message: `${key} must be a boolean` };
    }
    parsed[key] = value;
  }

  if (raw.design_status !== undefined && raw.design_status !== null) {
    if (!isAllowed(DESIGN_STATUSES, raw.design_status)) {
      return { ok: false, message: "design_status is not a recognized value" };
    }
    parsed.design_status = raw.design_status;
  }

  if (raw.finish !== undefined && raw.finish !== null) {
    if (!isAllowed(FINISHES, raw.finish)) {
      return { ok: false, message: "finish is not a recognized value" };
    }
    parsed.finish = raw.finish;
  }

  if (raw.shape !== undefined && raw.shape !== null) {
    if (!isAllowed(SHAPES, raw.shape)) {
      return { ok: false, message: "shape must be square, circle, or die_cut" };
    }
    parsed.shape = raw.shape;
  }

  if (raw.addons !== undefined && raw.addons !== null) {
    if (!Array.isArray(raw.addons)) {
      return { ok: false, message: "addons must be an array" };
    }
    if (raw.addons.length > MAX_ADDONS) {
      return { ok: false, message: `addons must contain ${MAX_ADDONS} entries or fewer` };
    }
    const addons: Addon[] = [];
    for (const addon of raw.addons) {
      if (!isAllowed(ADDONS, addon)) {
        return { ok: false, message: "addons contains an unrecognized value" };
      }
      addons.push(addon);
    }
    parsed.addons = addons;
  }

  return { ok: true, value: parsed };
}

function badRequest(message: string) {
  return NextResponse.json(
    { status: "BLOCKED", clarification_notes: [message] },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parsed = parseEstimateBody(raw);
  if (!parsed.ok) {
    return badRequest(parsed.message);
  }

  try {
    const result = estimate(parsed.value);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Estimate error:", err);
    return NextResponse.json(
      { status: "BLOCKED", clarification_notes: ["Server error — check input format"] },
      { status: 400 }
    );
  }
}
