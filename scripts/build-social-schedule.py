#!/usr/bin/env python3
"""
Derive src/lib/data/social-schedule.json from the new evergreen + seasonal
campaigns in gbp-products.json.

Why a separate file:
  GBP posts are product-style (price spec, hours, pickup address).
  IG/FB captions diverge — broader storytelling, hashtag stacks, no address dump.
  Source of truth is gbp-products.json. Re-run this script after any edit
  to those campaigns to keep the social schedule in sync.

Run:
  python3 scripts/build-social-schedule.py
"""

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/lib/data/gbp-products.json"
OUT = ROOT / "src/lib/data/social-schedule.json"

# Campaigns to mirror to social (the 10 added 2026-05-05)
SOCIAL_CAMPAIGNS = {
    "Banner Printing — Evergreen",
    "ACP Aluminum Signs — Evergreen",
    "Coroplast Signs — Evergreen",
    "Business Cards — Evergreen",
    "Sign Company — Evergreen",
    "Canada Day",
    "Back-to-School",
    "Halloween",
    "Black Friday",
    "Holiday Season",
}

# Hashtag stacks — Saskatoon B2B printer, 12-15 tags per post
HASHTAGS = {
    "Banner Printing — Evergreen":
        "#Saskatoon #YXE #SaskatoonBusiness #SaskatoonSmallBusiness "
        "#VinylBanners #PrintShop #WideFormatPrint #CustomBanners "
        "#OutdoorBanners #SaskatoonPrinting #SaskatoonRestaurants #SaskatoonRetail",
    "ACP Aluminum Signs — Evergreen":
        "#Saskatoon #YXE #SaskatoonBusiness #PrintShop "
        "#ACPSigns #AluminumSigns #StorefrontSigns #CommercialSignage "
        "#SaskatoonSigns #OfficeDirectory #SaskatoonPrinting #SaskatoonContractors",
    "Coroplast Signs — Evergreen":
        "#Saskatoon #YXE #SaskatoonBusiness #PrintShop "
        "#CoroplastSigns #YardSigns #JobSiteSigns #RealEstateSigns "
        "#SaskatoonRealEstate #SaskatoonContractors #SaskatoonPrinting #CustomSigns",
    "Business Cards — Evergreen":
        "#Saskatoon #YXE #SaskatoonBusiness #SaskatoonSmallBusiness "
        "#BusinessCards #PrintShop #SaskatoonRealtors #SaskatoonRestaurants "
        "#NetworkingCards #14ptCardstock #SaskatoonPrinting #LocalPrinter",
    "Sign Company — Evergreen":
        "#Saskatoon #YXE #SaskatoonBusiness #PrintShop "
        "#SaskatoonSigns #SignCompany #StorefrontSigns #JobSiteSigns "
        "#WayfindingSigns #SaskatoonContractors #SaskatoonPrinting #CustomSignage",
    "Canada Day":
        "#Saskatoon #YXE #CanadaDay #CanadaDay2026 "
        "#HappyCanadaDay #CanadianPride #SaskatoonCelebration #VinylBanners "
        "#WindowDecals #SaskatoonRestaurants #SaskatoonBars #SaskatoonRetail",
    "Back-to-School":
        "#Saskatoon #YXE #BackToSchool #BackToSchool2026 "
        "#SaskatoonSchools #SaskatoonDaycare #ClassroomSigns #SchoolFlyers "
        "#PrintShop #NewSchoolYear #SaskatoonPrinting #SaskatoonBusiness",
    "Halloween":
        "#Saskatoon #YXE #Halloween #HalloweenSaskatoon "
        "#WindowDecals #EventSigns #PrintShop #SaskatoonBars "
        "#SaskatoonRestaurants #PopUpShop #SaskatoonRetail #SaskatoonPrinting",
    "Black Friday":
        "#Saskatoon #YXE #BlackFriday #BlackFriday2026 "
        "#SaskatoonRetail #SaleSigns #WindowDecals #SaskatoonShopping "
        "#StorefrontSignage #PrintShop #SaskatoonBusiness #SaskatoonPrinting",
    "Holiday Season":
        "#Saskatoon #YXE #HolidaySeason #ChristmasSaskatoon "
        "#WindowDecals #HolidayDecor #PrintShop #SaskatoonRetail "
        "#SaskatoonRestaurants #OpenHouseFlyers #SaskatoonBusiness #SaskatoonPrinting",
}

# Map English "Month DD, YYYY" + "H:MM AM" -> ISO 8601 (Saskatoon = MDT, no DST = UTC-6)
def to_iso(date_str: str, time_str: str) -> str:
    months = {"January":1,"February":2,"March":3,"April":4,"May":5,"June":6,
              "July":7,"August":8,"September":9,"October":10,"November":11,"December":12}
    m = re.match(r"([A-Z][a-z]+) (\d{1,2}), (\d{4})", date_str)
    if not m:
        return f"{date_str}T{time_str}"
    mo, dd, yyyy = months[m.group(1)], int(m.group(2)), int(m.group(3))
    t = re.match(r"(\d{1,2}):(\d{2})\s*(AM|PM)", time_str.strip(), re.I)
    if not t:
        hh, mm = 9, 0
    else:
        hh, mm, ap = int(t.group(1)), int(t.group(2)), t.group(3).upper()
        if ap == "PM" and hh != 12: hh += 12
        if ap == "AM" and hh == 12: hh = 0
    return f"{yyyy:04d}-{mo:02d}-{dd:02d}T{hh:02d}:{mm:02d}:00-06:00"

def utm_swap(url: str) -> str:
    """Replace gbp_post UTM params with social media equivalents."""
    if "?" not in url:
        return url
    base, query = url.split("?", 1)
    params = []
    for kv in query.split("&"):
        k, _, v = kv.partition("=")
        if k == "utm_source": v = "instagram"
        elif k == "utm_medium": v = "social"
        params.append(f"{k}={v}")
    return f"{base}?{'&'.join(params)}"

def derive_caption(post: dict, platform: str) -> str:
    """
    Strip GBP-specific filler (full address, full phone repetition) and reshape
    for IG/FB tone. IG ≤ 2200 chars (target ~600), FB up to 5000 (target ~800).
    """
    desc = post.get("description", "").strip()
    title = post.get("title", "").strip()

    # Drop the trailing "Pickup at 216 33rd St W..." line — covered by the link
    desc = re.sub(r"\n+Pickup at[^\n]*\n*", "\n", desc)
    desc = re.sub(r"216 33rd St W,? Saskatoon\.?\s*", "", desc)
    # Strip phone — call-to-action lives in CTA field for social
    desc = re.sub(r"Call\s*\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}\.?\s*", "", desc)
    desc = re.sub(r"\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}\.?\s*", "", desc)
    # Strip orphan "Call" or "Call now" left over from phone removal
    desc = re.sub(r"\n\s*Call(\s+now)?\.?\s*\n", "\n", desc, flags=re.I)
    desc = re.sub(r"\n\s*Call(\s+now)?\.?\s*$", "", desc, flags=re.I)
    # Collapse whitespace
    desc = re.sub(r"\n{3,}", "\n\n", desc).strip()

    if platform == "instagram":
        # Lead with title if present, then desc, end with link-in-bio cue
        body = f"{title}\n\n{desc}" if title else desc
        body += "\n\nOrder online → truecolorprinting.ca\nLocal pickup or shipping across SK."
        return body
    if platform == "facebook":
        body = f"{title}\n\n{desc}" if title else desc
        body += (
            "\n\nIn-house at 216 33rd St W, Saskatoon. Call (306) 954-8688 "
            "or order online: truecolorprinting.ca"
        )
        return body
    return desc

def main():
    src = json.loads(SRC.read_text())

    out = {
        "_meta": {
            "generatedFrom": "src/lib/data/gbp-products.json::postSchedule",
            "generatedAt": datetime.now().strftime("%Y-%m-%d"),
            "platforms": ["instagram", "facebook"],
            "imageStrategy": {
                "source": "public/images/... — 4:3 GBP master",
                "feed_1x1": "Crop to 1080×1080 — ImageMagick: convert IN -gravity center -resize 1080x1080^ -extent 1080x1080 OUT",
                "story_9x16": "Crop to 1080×1920 — convert IN -gravity center -resize 1080x1920^ -extent 1080x1920 OUT",
                "note": "Crop variants deferred — Pass 2. Blotato accepts master file; uploader can crop on ingest.",
            },
            "blotato": {
                "ingestionFormat": "POST /api/posts with {imageUrl, caption, scheduledAt, link} per platform",
                "envVar": "BLOTATO_API_KEY",
                "wiring": "Build the /staff/social/blotato UI in next session — see vault note 2026-05-05-ddg-image-backfill-and-gbp-dashboard.md",
            },
            "totalCampaigns": 0,
            "totalPosts": 0,
        },
        "posts": [],
    }

    counts = {"campaigns": 0, "posts": 0}
    for camp in src["postSchedule"]:
        if camp["campaign"] not in SOCIAL_CAMPAIGNS:
            continue
        counts["campaigns"] += 1
        camp_slug = re.sub(r"[^a-z0-9]+", "-", camp["campaign"].lower()).strip("-")
        for idx, post in enumerate(camp["posts"]):
            scheduled_at = to_iso(post.get("publishDate", ""), post.get("publishTime", "9:00 AM"))
            link = utm_swap(post.get("redeemUrl") or post.get("buttonUrl") or "https://truecolorprinting.ca")
            entry = {
                "id": f"{camp_slug}-{idx + 1:02d}",
                "campaign": camp["campaign"],
                "postType": post.get("postType"),
                "scheduledAt": scheduled_at,
                "imageSource": post.get("imagePath"),
                "crops": {
                    "feed_1x1": None,
                    "story_9x16": None,
                },
                "captions": {
                    "instagram": derive_caption(post, "instagram"),
                    "facebook": derive_caption(post, "facebook"),
                },
                "hashtags": HASHTAGS.get(camp["campaign"], "#Saskatoon #YXE #PrintShop"),
                "link": link,
                "callToAction": "Order online",
            }
            out["posts"].append(entry)
            counts["posts"] += 1

    out["_meta"]["totalCampaigns"] = counts["campaigns"]
    out["_meta"]["totalPosts"] = counts["posts"]

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"OK  {counts['campaigns']} campaigns -> {counts['posts']} social posts")
    print(f"OK  {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
