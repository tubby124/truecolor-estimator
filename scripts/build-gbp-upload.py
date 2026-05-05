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

    # === HTML (interactive copy-paste) ===
    write_html(data, OUT_DIR, post_idx)

    print(f"OK  Products: {len(data['products'])} -> {IMG_OUT}")
    print(f"OK  Posts:    {post_idx} -> {POST_OUT}")
    print(f"OK  GBP_PRODUCTS.md + GBP_POSTS.md + GBP_DASHBOARD.html regenerated in {OUT_DIR}")


def html_escape(s):
    if s is None:
        return ""
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#39;"))


def copy_field(label, value, multiline=False):
    """Render a labeled value with a Copy button. Vanilla JS clipboard."""
    if not value:
        return ""
    safe = html_escape(value)
    klass = "copy-multi" if multiline else "copy-single"
    return f"""
        <div class="field {klass}">
          <div class="field-label">{html_escape(label)}</div>
          <div class="field-value">{safe}</div>
          <button class="copy-btn" data-clip="{safe}" type="button">Copy</button>
        </div>"""


def product_card(i, p, img_filename):
    img_block = (f'<img class="card-img" src="images/{html_escape(img_filename)}" alt="{html_escape(p["name"])}">'
                 if img_filename else '<div class="card-img card-img-missing">No image</div>')
    img_path_field = copy_field("Image filename", f"images/{img_filename}") if img_filename else ""
    return f"""
    <article class="card" id="product-{i}" data-search="{html_escape(p['name'].lower() + ' ' + p['category'].lower() + ' ' + p['slug'])}">
      <header class="card-header">
        <span class="card-num">{i:02d}</span>
        <h3>{html_escape(p['name'])}</h3>
        <span class="card-cat">{html_escape(p['category'])}</span>
      </header>
      <div class="card-body">
        {img_block}
        <div class="card-fields">
          {copy_field("Product name", p['name'])}
          {copy_field("Price", p['price'])}
          {copy_field("CTA button", p['cta'])}
          {copy_field("Link", p['url'])}
          {img_path_field}
          {copy_field("Description", p['description'], multiline=True)}
        </div>
      </div>
    </article>"""


def post_card(idx, post, img_filename, campaign):
    ptype = post.get("postType", "Update")
    img_block = (f'<img class="card-img" src="posts/{html_escape(img_filename)}" alt="{html_escape(post.get("title","Post"))}">'
                 if img_filename else '<div class="card-img card-img-missing">No image</div>')
    img_path_field = copy_field("Image filename", f"posts/{img_filename}") if img_filename else ""
    offer_fields = ""
    if ptype.lower() == "offer":
        offer_fields = (
            copy_field("Offer start", f"{post.get('offerStart','')} {post.get('offerStartTime','')}".strip())
            + copy_field("Offer end", f"{post.get('offerEnd','')} {post.get('offerEndTime','')}".strip())
            + copy_field("Terms", post.get("terms", ""), multiline=True)
            + copy_field("Redeem URL", post.get("redeemUrl", ""))
        )
    title = post.get("title") or "(no title — Update post)"
    return f"""
    <article class="card" id="post-{idx}" data-search="{html_escape((title + ' ' + campaign + ' ' + ptype).lower())}">
      <header class="card-header">
        <span class="card-num">{idx:02d}</span>
        <h3>{html_escape(title)}</h3>
        <span class="card-cat type-{html_escape(ptype.lower())}">{html_escape(ptype)}</span>
        <span class="card-cat">{html_escape(campaign)}</span>
      </header>
      <div class="card-body">
        {img_block}
        <div class="card-fields">
          {copy_field("Publish date", post.get('publishDate',''))}
          {copy_field("Publish time", post.get('publishTime',''))}
          {copy_field("Title", title)}
          {copy_field("Description", post.get('description',''), multiline=True)}
          {offer_fields}
          {img_path_field}
        </div>
      </div>
    </article>"""


def write_html(data, out_dir, post_idx):
    products_html = []
    for i, p in enumerate(data["products"], 1):
        src = resolve_image(p.get("imagePath"))
        ext = src.suffix.lower() if src else ".webp"
        img_name = f"{i:02d}-{p['slug']}{ext}" if src else None
        products_html.append(product_card(i, p, img_name))

    posts_html = []
    pidx = 0
    for sched in data["postSchedule"]:
        for post in sched["posts"]:
            pidx += 1
            src = resolve_image(post.get("imagePath"))
            ext = src.suffix.lower() if src else ".webp"
            title_slug = slugify(post.get("title") or post.get("description", ""))[:40]
            date = date_slug(post.get("publishDate", ""))
            img_name = f"post-{pidx:02d}-{date}-{title_slug}{ext}" if src else None
            posts_html.append(post_card(pidx, post, img_name, sched["campaign"]))

    css = """
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:#1c1712;line-height:1.5}
      .header{background:#1c1712;color:#fff;padding:18px 28px;position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
      .header h1{font-size:18px;font-weight:800}
      .header .meta{font-size:11px;color:#999;letter-spacing:.5px;text-transform:uppercase}
      .header .badge{background:#e63020;color:#fff;font-size:10px;font-weight:800;padding:4px 10px;border-radius:99px;letter-spacing:.5px;text-transform:uppercase}
      .tabs{background:#fff;border-bottom:1px solid #e5e5e5;padding:0 28px;display:flex;gap:0;position:sticky;top:54px;z-index:99}
      .tab{padding:14px 18px;font-size:13px;font-weight:700;color:#666;cursor:pointer;border:none;background:transparent;border-bottom:3px solid transparent;transition:all .15s}
      .tab.active{color:#e63020;border-bottom-color:#e63020}
      .tab:hover:not(.active){color:#1c1712;background:#fafafa}
      .toolbar{background:#fff;padding:14px 28px;border-bottom:1px solid #e5e5e5;display:flex;gap:12px;align-items:center;position:sticky;top:104px;z-index:98}
      .search{flex:1;max-width:400px;padding:9px 14px;border:1px solid #e5e5e5;border-radius:8px;font-size:13px;outline:none;font-family:inherit}
      .search:focus{border-color:#e63020}
      .toolbar .count{font-size:12px;color:#666;font-weight:600}
      main{max-width:1200px;margin:0 auto;padding:24px 28px}
      .panel{display:none}
      .panel.active{display:block}
      .card{background:#fff;border-radius:14px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden}
      .card.hidden{display:none}
      .card-header{background:#fafafa;padding:14px 20px;display:flex;align-items:center;gap:14px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap}
      .card-num{background:#e63020;color:#fff;width:32px;height:32px;border-radius:8px;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .card-header h3{font-size:15px;font-weight:800;flex:1;min-width:200px}
      .card-cat{background:#f0f0f0;color:#666;font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;letter-spacing:.5px;text-transform:uppercase}
      .type-offer{background:#fef3c7;color:#92400e}
      .type-event{background:#dbeafe;color:#1e40af}
      .type-update{background:#dcfce7;color:#166534}
      .card-body{display:grid;grid-template-columns:200px 1fr;gap:20px;padding:20px}
      @media (max-width:720px){.card-body{grid-template-columns:1fr}}
      .card-img{width:100%;height:auto;border-radius:8px;border:1px solid #e5e5e5;background:#f5f5f7}
      .card-img-missing{aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px;font-weight:600}
      .card-fields{display:flex;flex-direction:column;gap:10px}
      .field{position:relative;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:10px 14px;padding-right:70px}
      .field-label{font-size:9px;font-weight:800;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
      .field-value{font-size:13px;color:#1c1712;word-break:break-word}
      .copy-multi .field-value{white-space:pre-wrap;line-height:1.55}
      .copy-btn{position:absolute;right:8px;top:8px;background:#1c1712;color:#fff;border:none;font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;cursor:pointer;font-family:inherit;transition:all .15s}
      .copy-btn:hover{background:#e63020}
      .copy-btn.copied{background:#16a34a}
      .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:#1c1712;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.2);transition:transform .3s;z-index:200}
      .toast.show{transform:translateX(-50%) translateY(0)}
    """
    js = """
      const $ = s => document.querySelector(s);
      const $$ = s => Array.from(document.querySelectorAll(s));
      const toast = $('#toast');
      function showToast(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1400); }
      $$('.copy-btn').forEach(btn=>{
        btn.addEventListener('click', async()=>{
          try {
            await navigator.clipboard.writeText(btn.dataset.clip);
            btn.textContent = 'Copied'; btn.classList.add('copied');
            showToast('Copied to clipboard');
            setTimeout(()=>{ btn.textContent='Copy'; btn.classList.remove('copied'); }, 1400);
          } catch(e){ showToast('Copy failed'); }
        });
      });
      $$('.tab').forEach(t=>{
        t.addEventListener('click', ()=>{
          $$('.tab').forEach(x=>x.classList.remove('active'));
          $$('.panel').forEach(x=>x.classList.remove('active'));
          t.classList.add('active');
          $('#panel-'+t.dataset.tab).classList.add('active');
          $('#search').value=''; filter('');
        });
      });
      function filter(q){
        q = q.trim().toLowerCase();
        const panel = $('.panel.active');
        let shown = 0;
        panel.querySelectorAll('.card').forEach(c=>{
          const match = !q || c.dataset.search.includes(q);
          c.classList.toggle('hidden', !match);
          if(match) shown++;
        });
        $('#count').textContent = shown + ' shown';
      }
      $('#search').addEventListener('input', e=>filter(e.target.value));
      filter('');
    """
    n_products = len(data["products"])
    from datetime import datetime
    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GBP Dashboard — True Color</title>
<style>{css}</style>
</head>
<body>
<header class="header">
  <h1>GBP Dashboard</h1>
  <span class="meta">216 33rd St W, Saskatoon · Generated {generated}</span>
  <span class="badge">{n_products} products · {post_idx} posts</span>
</header>
<nav class="tabs">
  <button class="tab active" data-tab="products" type="button">Products ({n_products})</button>
  <button class="tab" data-tab="posts" type="button">Scheduled posts ({post_idx})</button>
</nav>
<div class="toolbar">
  <input id="search" class="search" type="text" placeholder="Search by name, category, type…">
  <span class="count" id="count">all</span>
</div>
<main>
  <section id="panel-products" class="panel active">
    {''.join(products_html)}
  </section>
  <section id="panel-posts" class="panel">
    {''.join(posts_html)}
  </section>
</main>
<div id="toast" class="toast">Copied</div>
<script>{js}</script>
</body>
</html>"""
    (out_dir / "GBP_DASHBOARD.html").write_text(html)

if __name__ == "__main__":
    main()
