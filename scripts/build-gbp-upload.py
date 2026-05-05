#!/usr/bin/env python3
"""
Regenerate the GBP_UPLOAD folder for manual Google Business Profile uploads.

Reads:  src/lib/data/gbp-products.json
Writes: ../GBP_UPLOAD/{images,posts,GBP_PRODUCTS.md,GBP_POSTS.md}

Run from the truecolor-estimator/ root:
  python3 scripts/build-gbp-upload.py
"""

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # truecolor-estimator/
JSON_PATH = ROOT / "src/lib/data/gbp-products.json"
OUT_DIR = ROOT.parent / "GBP_UPLOAD"
IMG_OUT = OUT_DIR / "images"
POST_OUT = OUT_DIR / "posts"

# Categories that already exist in the GBP account vs. need creation
EXISTING_CATEGORIES = {
    "Signs & Displays", "Outdoor Signage", "Vehicle Decor",
    "Stickers", "Seasonal Signs & Banners",
}
NEW_CATEGORIES = {"Print & Promo", "Services", "Window & Vehicle Graphics", "Print Marketing", "Industry Solutions"}

def slugify(s):
    if not s:
        return "untitled"
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9-]", "-", s.lower())).strip("-") or "untitled"

def date_slug(d):
    if not d:
        return "no-date"
    months = {"January":"01","February":"02","March":"03","April":"04","May":"05","June":"06",
              "July":"07","August":"08","September":"09","October":"10","November":"11","December":"12"}
    m = re.match(r"([A-Z][a-z]+) (\d{1,2}), (\d{4})", d)
    if m:
        return f"{m.group(3)}-{months.get(m.group(1),'??')}-{int(m.group(2)):02d}"
    return re.sub(r"[^a-zA-Z0-9-]", "-", d).strip("-")

def resolve_image(image_path):
    """Convert imagePath (e.g. 'public/images/...' or '/images/...') to filesystem path."""
    if not image_path:
        return None
    p = image_path.lstrip("/")
    if p.startswith("public/"):
        candidate = ROOT / p
    else:
        candidate = ROOT / "public" / p
    return candidate if candidate.exists() else None

def main():
    data = json.loads(JSON_PATH.read_text())

    # Clean old images/posts
    for d in (IMG_OUT, POST_OUT):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)

    # === PRODUCTS ===
    md = ["# Google My Business — Products Reference",
          "**True Color Display Printing** | 216 33rd St W, Saskatoon | (306) 954-8688",
          f"**Total products:** {len(data['products'])} | All images are in the `images/` folder beside this file",
          "", "---", "",
          "## HOW TO ADD EACH PRODUCT", "",
          "1. Go to **business.google.com** → click **Edit products** → **+ Add product**",
          "2. Copy each field below exactly as shown",
          "3. Upload the image file listed (drag from the `images/` folder)",
          "4. Click **Save** → repeat for next product",
          "", "---", "",
          "## CATEGORIES YOU NEED", ""]

    used_cats = sorted({p["category"] for p in data["products"]})
    have, create = [], []
    for c in used_cats:
        (have if c in EXISTING_CATEGORIES else create).append(c)
    md.append("**You already have these** (do not recreate):")
    for c in have:
        md.append(f"- {c}")
    md.append("")
    if create:
        md.append("**Create these new ones** (type the name, hit Enter):")
        for c in create:
            md.append(f"- `{c}`")
        md.append("")
    md.append("---\n---")

    for i, p in enumerate(data["products"], 1):
        n = f"{i:02d}"
        slug = p["slug"]
        src = resolve_image(p.get("imagePath"))
        if src:
            ext = src.suffix.lower() or ".webp"
            dst_name = f"{n}-{slug}{ext}"
            dst = IMG_OUT / dst_name
            shutil.copy2(src, dst)
            img_line = f"images/{dst_name}"
        else:
            img_line = "(no image — generate one)"

        md += ["", f"## PRODUCT {i} — {p['name']}", "",
               f"**Image file:** `{img_line}`", "",
               "**Product name** (copy exactly):", "```", p["name"], "```", "",
               f"**Category:** {p['category']}", "",
               f"**Price:** {p['price']}", "",
               "**Description** (copy the full paragraph — every sentence):",
               "```", p["description"], "```", "",
               f"**CTA button:** {p['cta']}", "",
               "**Link:**", "```", p["url"], "```", "", "---"]

    (OUT_DIR / "GBP_PRODUCTS.md").write_text("\n".join(md) + "\n")

    # === POSTS ===
    pmd = ["# Google My Business — Scheduled Posts Reference",
           "**True Color Display Printing** | 216 33rd St W, Saskatoon | (306) 954-8688",
           f"**Total scheduled posts:** {sum(len(s['posts']) for s in data['postSchedule'])} across {len(data['postSchedule'])} campaigns",
           "", "---", "",
           "## HOW TO POST EACH ONE", "",
           "1. Go to **business.google.com** → click **Add update** / **Add offer** / **Add event**",
           "2. Match the post type listed below",
           "3. Upload the image file from the `posts/` folder",
           "4. Copy the title and description exactly",
           "5. For Offers: set the start/end dates and redeem URL",
           "6. Schedule or post immediately based on the publishDate listed",
           "", "---"]

    post_idx = 0
    for sched in data["postSchedule"]:
        pmd += ["", f"## CAMPAIGN — {sched['campaign']}", ""]
        for post in sched["posts"]:
            post_idx += 1
            n = f"{post_idx:02d}"
            ptype = post.get("postType", "Update")
            title_slug = slugify(post.get("title") or post.get("description", ""))[:40]
            date = date_slug(post.get("publishDate", ""))
            src = resolve_image(post.get("imagePath"))
            if src:
                ext = src.suffix.lower() or ".webp"
                dst_name = f"post-{n}-{date}-{title_slug}{ext}"
                dst = POST_OUT / dst_name
                shutil.copy2(src, dst)
                img_line = f"posts/{dst_name}"
            else:
                img_line = "(no image)"

            pmd += [f"### POST {post_idx} — {post.get('title', 'Untitled')} ({ptype})",
                    "",
                    f"**Image file:** `{img_line}`",
                    f"**Publish:** {date} {post.get('publishTime', '')}",
                    "",
                    "**Title:**", "```", post.get("title", ""), "```", "",
                    "**Description:**", "```", post.get("description", ""), "```", ""]

            if ptype.lower() == "offer":
                pmd += [f"**Offer start:** {post.get('offerStart', '')} {post.get('offerStartTime', '')}",
                        f"**Offer end:** {post.get('offerEnd', '')} {post.get('offerEndTime', '')}",
                        ""]
                if post.get("terms"):
                    pmd += ["**Terms:**", "```", post["terms"], "```", ""]
                if post.get("redeemUrl"):
                    pmd += ["**Redeem URL:**", "```", post["redeemUrl"], "```", ""]

            pmd.append("---")

    (OUT_DIR / "GBP_POSTS.md").write_text("\n".join(pmd) + "\n")

    print(f"OK  Products: {len(data['products'])} -> {IMG_OUT}")
    print(f"OK  Posts:    {post_idx} -> {POST_OUT}")
    print(f"OK  GBP_PRODUCTS.md + GBP_POSTS.md regenerated in {OUT_DIR}")

if __name__ == "__main__":
    main()
