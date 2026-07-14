#!/usr/bin/env python3
import json, os, re, base64, subprocess, html, tempfile

BASE = "/private/tmp/claude-501/-Users-badi-claude/c59406a6-8daa-4ccb-b45d-260e3c44b75b/scratchpad"
ASSETS = os.path.join(BASE, "assets")
OUT = os.path.join(BASE, "lifecycle-visuals-preview.html")

# ---------- asset data URIs (downscaled) ----------
ASSET_FILES = {
    "banner":        os.path.join(ASSETS, "banner.png"),
    "demo-still":    os.path.join(ASSETS, "demo-still.png"),
    "llm-row":       os.path.join(ASSETS, "llm-row.png"),
    "markets-row":   os.path.join(ASSETS, "markets-row.png"),
    "workflow-22":   os.path.join(BASE,   "workflow-22.png"),
    "workflow-quant":os.path.join(ASSETS, "workflow-quant.png"),
    "workflow-nodes":os.path.join(ASSETS, "workflow-nodes.png"),
    "starter-trio":  os.path.join(ASSETS, "starter-trio.png"),
}

def data_uri_png(path, max_dim=1200):
    """Downscale to max_dim on the longest side (copy), base64-encode as data URI."""
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    tmp.close()
    subprocess.run(["sips", "-Z", str(max_dim), path, "--out", tmp.name],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with open(tmp.name, "rb") as f:
        b = f.read()
    os.unlink(tmp.name)
    return "data:image/png;base64," + base64.b64encode(b).decode()

print("Encoding assets...")
ASSET_URI = {k: data_uri_png(v) for k, v in ASSET_FILES.items()}
for k, u in ASSET_URI.items():
    print(f"  {k}: {len(u)//1024} KB")

# ---------- customer.io hosted images -> data URIs ----------
CIO = {
    "logo":   "https://userimg-assets.customeriomail.com/images/client-env-208004/01KWMB6KMM19M32QTJWAGFM3P6.png",
    "footer": "https://userimg-assets.customeriomail.com/images/client-env-208004/01KWMB6C6XST9N06YH87N7RRT9.png",
}
TRANSPARENT_PX = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

def fetch_cio(url):
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    tmp.close()
    r = subprocess.run(["curl", "-sSL", "--max-time", "25", "-o", tmp.name, url])
    ok = r.returncode == 0 and os.path.getsize(tmp.name) > 200
    if ok:
        try:
            uri = data_uri_png(tmp.name, max_dim=400)
        except Exception:
            ok = False
    if not ok:
        uri = TRANSPARENT_PX
    if os.path.exists(tmp.name):
        os.unlink(tmp.name)
    return uri, ok

print("Fetching customer.io images...")
CIO_URI = {}
for k, url in CIO.items():
    uri, ok = fetch_cio(url)
    CIO_URI[k] = uri
    print(f"  {k}: {'OK' if ok else 'PLACEHOLDER'} ({len(uri)//1024} KB)")

def replace_cio_srcs(body):
    """Replace any customeriomail src (logo or footer icon) with data URIs."""
    def repl(mo):
        url = mo.group(1)
        low = url.lower()
        if "01kwmb6kmm" in low:
            uri = CIO_URI["logo"]
        else:
            uri = CIO_URI["footer"]  # footer icon or any other cio-hosted image
        return f'src="{uri}"'
    return re.sub(r'src="(https://userimg-assets\.customeriomail\.com/[^"]+)"', repl, body)

# ---------- image builders ----------
def img_tag(asset_key, bordered=False):
    border = "border:1px solid #D5DBE3;border-radius:8px;" if bordered else ""
    return (f'<img src="{ASSET_URI[asset_key]}" alt="{asset_key}" '
            f'style="display:block;margin:16px auto;width:100%;max-width:520px;'
            f'height:auto;{border}">')

def banner_band():
    return (f'<tr><td style="padding:0;"><img src="{ASSET_URI["banner"]}" alt="banner" '
            f'style="display:block;width:100%;height:auto;margin:0;"></td></tr>')

# ---------- insertion helpers ----------
def insert_after_close(body, anchor, close_tag, snippet, note_ref):
    """Insert snippet right after the first close_tag following anchor."""
    i = body.find(anchor)
    if i < 0:
        return None
    j = body.find(close_tag, i)
    if j < 0:
        return None
    j += len(close_tag)
    return body[:j] + "\n" + snippet + "\n" + body[j:]

def insert_before_last_open(body, anchor, open_tag, snippet):
    """Insert snippet right before the last open_tag occurring before anchor."""
    i = body.find(anchor)
    if i < 0:
        return None
    j = body.rfind(open_tag, 0, i)
    if j < 0:
        return None
    return body[:j] + snippet + "\n" + body[j:]

def insert_banner(body):
    """Insert a full-width banner band right before the logo row (inside the card)."""
    i = body.find('class="logo-td"')  # attribute form, not the CSS ".logo-td" rule
    if i < 0:
        # fallback: before first logo img
        i = body.find('alt="NickAI"')
        if i < 0:
            return None
    j = body.rfind("<tr", 0, i)
    if j < 0:
        return None
    return body[:j] + banner_band() + "\n" + body[j:]

def insert_after_h1(body, snippet):
    m = re.search(r"</h1>", body)
    if not m:
        # some emails use the first heading paragraph; fall back to first </p>
        m = re.search(r"</p>", body)
        if not m:
            return None
    j = m.end()
    return body[:j] + "\n" + snippet + "\n" + body[j:]

# ---------- placement plan ----------
# each: (asset_key, bordered, placement_note, insert_fn)
def P_after(anchor, close_tag):
    return ("after", anchor, close_tag)
def P_before(anchor, open_tag):
    return ("before", anchor, open_tag)
def P_banner():
    return ("banner",)

# workflow/screenshot assets get a border
BORDERED = {"workflow-22", "workflow-quant", "workflow-nodes", "demo-still"}

PLAN = {
    17: ("banner",        P_banner(),
         "banner.png as full-width band at very top, above the logo"),
    19: ("workflow-22",   P_after("Clone community templates", "</table>"),
         "workflow-22.png after the 4-item list of things paid users do"),
    78: ("llm-row",       P_after("Claude, GPT, Gemini, Grok", "</p>"),
         "llm-row.png right after the Claude/GPT/Gemini/Grok paragraph"),
    35: ("markets-row",   P_after("Polymarket", "</table>"),
         "markets-row.png under the changelog bullets (Kalshi/Polymarket)"),
    77: ("workflow-22",   P_after("pair-trade setups with auto-rebalance", "</p>"),
         "workflow-22.png after the advanced-templates paragraph"),
    49: ("demo-still",    P_after("weigh in on a call together", "</table>"),
         "demo-still.png after the 3 capability bullets"),
    51: ("workflow-nodes",P_after("turn it into a workflow", "</ul>"),
         "workflow-nodes.png (4-node) after the 3-step path"),
    53: ("starter-trio",  P_before("Smart Price Alert", "<table"),
         "starter-trio.png at the top of the 3 starter-agent descriptions"),
    70: ("llm-row",       P_after("Claude, GPT, Gemini, Grok", "</p>"),
         "llm-row.png right after the Claude/GPT/Gemini/Grok paragraph"),
    72: ("demo-still",    P_after("paper-buy 100 USDC worth", "</p>"),
         "demo-still.png after the example-prompt paragraph"),
    57: ("banner",        P_banner(),
         "banner.png as full-width band at very top, above the logo"),
    61: ("starter-trio",  P_after("Morning Edge Brief", "</table>"),
         "starter-trio.png after the 3-agent list"),
    75: ("workflow-quant",P_after("sentiment-driven entries", "</p>"),
         "workflow-quant.png after the strategy-types paragraph"),
    65: ("banner",        P_banner(),
         "banner.png as full-width band at very top, above the logo"),
    67: ("starter-trio",  P_before("Smart Price Alert", "<p"),
         "starter-trio.png at the detailed agent descriptions"),
}

TEXT_ONLY = {
    21: "Founder-voice two-week feedback check-in; an image hurts the personal, one-reply tone.",
    33: "Retention-reassurance after cancel; intimacy over imagery.",
    37: "Honest one-question winback feedback; imagery undercuts the ask.",
    59: "Softer reactivation + personal help offer; reads best unadorned.",
    63: "Gentle short reminder; imagery breaks the light, personal tone.",
    69: "Personal founder note; keep it a plain human note.",
}

CAMPAIGN_ORDER = [
    ("Post Upgrade", 3),
    ("Cancelled/Winback", 4),
    ("Freemium Onboarding", 6),
    ("credits depleted", 8),
    ("Re-Engagement", 9),
    ("Pre-Freemium Reactivation", 10),
]

# ---------- load emails ----------
emails = json.load(open(os.path.join(BASE, "email-final-all.json")))
by_id = {e["action_id"]: e for e in emails}

approximate = []  # action_ids placed after h1 as fallback

def place_image(aid):
    e = by_id[aid]
    asset_key, spec, note = PLAN[aid]
    body = replace_cio_srcs(e["body_html"])
    bordered = asset_key in BORDERED
    placed_note = note
    result = None
    if spec[0] == "banner":
        result = insert_banner(body)
        if result is None:
            result = insert_after_h1(body, banner_band())
            approximate.append(aid)
            placed_note = note + " (placement approximate: after H1)"
    elif spec[0] == "after":
        _, anchor, close_tag = spec
        snippet = img_tag(asset_key, bordered)
        result = insert_after_close(body, anchor, close_tag, snippet, aid)
        if result is None:
            result = insert_after_h1(body, snippet)
            approximate.append(aid)
            placed_note = note + " (placement approximate: after H1)"
    elif spec[0] == "before":
        _, anchor, open_tag = spec
        snippet = img_tag(asset_key, bordered)
        result = insert_before_last_open(body, anchor, open_tag, snippet)
        if result is None:
            result = insert_after_h1(body, snippet)
            approximate.append(aid)
            placed_note = note + " (placement approximate: after H1)"
    return result, asset_key, placed_note

# ---------- build page ----------
LEGEND = [
    ("banner.png", "Brand gradient banner (no text) - top accent"),
    ("demo-still.png", "Chat-to-workflow demo still - describe it, Nick builds it"),
    ("llm-row.png", "LLM logo row (Claude, ChatGPT, Gemini, Grok) - multi-model / consensus"),
    ("markets-row.png", "Venues logo row (Coinbase, Hyperliquid, OKX, Kalshi, Polymarket)"),
    ("workflow-22.png", "22-node workflow canvas - advanced orchestration"),
    ("workflow-quant.png", "12-node labeled quant workflow (BTC Paper Trader) - clonable strategy"),
    ("workflow-nodes.png", "4-node BTC alert graph - a simple automation"),
    ("starter-trio.png", "Starter-agent trio (Smart Price Alert + BTC Paper Trader + Morning Edge Brief)"),
]

parts = []
parts.append('<title>Lifecycle emails - proposed visuals (21)</title>')
parts.append('''<style>
  .lv-wrap{background:#EFF1F4;min-height:100vh;padding:32px 16px 80px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0A1929;}
  .lv-inner{max-width:760px;margin:0 auto;}
  .lv-h1{font-size:26px;font-weight:700;margin:0 0 6px;}
  .lv-sub{font-size:14px;color:#5B6470;margin:0 0 24px;}
  .lv-legend{background:#fff;border:1px solid #E1E5EA;border-radius:10px;padding:16px 18px;margin:0 0 28px;}
  .lv-legend h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#5B6470;margin:0 0 10px;}
  .lv-legend ul{margin:0;padding:0;list-style:none;}
  .lv-legend li{font-size:13px;line-height:1.5;color:#334155;padding:3px 0;}
  .lv-legend b{color:#0A1929;}
  .lv-campaign{font-size:18px;font-weight:700;margin:34px 0 4px;padding-bottom:8px;border-bottom:2px solid #D5DBE3;}
  .lv-campaign span{font-weight:400;font-size:13px;color:#5B6470;}
  .lv-card{background:#fff;border:1px solid #E1E5EA;border-radius:10px;padding:16px 16px 20px;margin:16px 0;}
  .lv-cap{font-size:13px;line-height:1.5;color:#334155;margin:0 0 12px;}
  .lv-cap .aid{display:inline-block;background:#0A1929;color:#fff;font-weight:700;border-radius:5px;padding:1px 7px;margin-right:6px;font-size:12px;}
  .lv-cap .subj{font-weight:600;color:#0A1929;}
  .lv-cap .asset{display:inline-block;background:#E6F0FF;color:#0357C7;border-radius:5px;padding:1px 7px;font-size:12px;font-weight:600;margin-left:4px;}
  .lv-cap .approx{color:#B45309;font-weight:600;}
  .lv-frame{display:block;width:100%;max-width:600px;margin:0 auto;border:1px solid #D5DBE3;border-radius:8px;overflow:hidden;background:#fff;min-height:200px;}
  .lv-textrow{background:#fff;border:1px solid #E1E5EA;border-left:4px solid #94A3B8;border-radius:8px;padding:12px 14px;margin:10px 0;font-size:13px;line-height:1.5;color:#334155;}
  .lv-textrow .aid{display:inline-block;background:#64748B;color:#fff;font-weight:700;border-radius:5px;padding:1px 7px;margin-right:6px;font-size:12px;}
  .lv-textrow .subj{font-weight:600;color:#0A1929;}
  .lv-textrow .reason{display:block;color:#5B6470;margin-top:4px;font-style:italic;}
</style>''')

parts.append('<div class="lv-wrap"><div class="lv-inner">')
parts.append('<h1 class="lv-h1">Lifecycle emails - proposed visuals (21)</h1>')
parts.append('<p class="lv-sub">15 emails get one image placed at the proposed anchor; 6 stay text-only. Each email rendered inside a 600px email frame for placement review.</p>')

# legend
parts.append('<div class="lv-legend"><h2>Asset legend</h2><ul>')
for name, desc in LEGEND:
    parts.append(f'<li><b>{html.escape(name)}</b> - {html.escape(desc)}</li>')
parts.append('</ul></div>')

for cname, cid in CAMPAIGN_ORDER:
    cam_emails = [e for e in emails if e["campaign_id"] == cid]
    n_img = sum(1 for e in cam_emails if e["action_id"] in PLAN)
    n_txt = sum(1 for e in cam_emails if e["action_id"] in TEXT_ONLY)
    parts.append(f'<div class="lv-campaign">{html.escape(cname)} '
                 f'<span>&nbsp;campaign {cid} - {len(cam_emails)} emails '
                 f'({n_img} image, {n_txt} text-only)</span></div>')
    for e in cam_emails:
        aid = e["action_id"]
        subj = html.escape(e["subject"])
        if aid in PLAN:
            rendered, asset_key, note = place_image(aid)
            approx = " (placement approximate)" in note or "approximate" in note
            approx_html = ' <span class="approx">[APPROX]</span>' if aid in approximate else ""
            parts.append('<div class="lv-card">')
            parts.append(
                f'<p class="lv-cap"><span class="aid">{aid}</span>'
                f'<span class="subj">{subj}</span>'
                f'<span class="asset">{asset_key}.png</span>{approx_html}<br>'
                f'<span style="color:#5B6470;">Placement: {html.escape(note)}</span></p>')
            srcdoc = html.escape(rendered, quote=True)
            parts.append(
                f'<iframe class="lv-frame" sandbox="allow-same-origin" '
                f'loading="lazy" scrolling="no" srcdoc="{srcdoc}" '
                f'onload="lvFit(this)"></iframe>')
            parts.append('</div>')
        elif aid in TEXT_ONLY:
            parts.append(
                f'<div class="lv-textrow"><span class="aid">{aid}</span>'
                f'<span class="subj">{subj}</span> '
                f'<span style="color:#94A3B8;">kept text-only</span>'
                f'<span class="reason">{html.escape(TEXT_ONLY[aid])}</span></div>')

parts.append('</div></div>')
parts.append('''<script>
function lvFit(f){
  try{
    var d=f.contentWindow.document;
    var h=Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
    f.style.height=(h+2)+'px';
  }catch(e){ f.style.height='700px'; }
}
window.addEventListener('load', function(){
  document.querySelectorAll('iframe.lv-frame').forEach(function(f){ lvFit(f); setTimeout(function(){lvFit(f);}, 300); });
});
</script>''')

html_out = "\n".join(parts)
with open(OUT, "w") as f:
    f.write(html_out)

size = os.path.getsize(OUT)
print(f"\nWrote {OUT}")
print(f"Size: {size/1024:.0f} KB ({size} bytes)")
print(f"Image emails placed: {len(PLAN)}")
print(f"Approximate placements: {approximate if approximate else 'none'}")
print(f"Text-only: {sorted(TEXT_ONLY.keys())}")
