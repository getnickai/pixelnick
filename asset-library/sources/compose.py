#!/usr/bin/env python3
import base64, os, subprocess, math, sys
from PIL import Image

BASE = "/private/tmp/claude-501/-Users-badi-claude/c59406a6-8daa-4ccb-b45d-260e3c44b75b/scratchpad"
EX = os.path.join(BASE, "nicksitev2/public/brand/exchanges")
ASSETS = os.path.join(BASE, "assets")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(ASSETS, "markets-row.png")

# name, path, aspect(w/h of viewBox), visual-letter fraction of box height, fine multiplier
LOGOS = [
    ("coinbase",    os.path.join(EX, "coinbase.svg"),            5.000, 0.883, 1.00),
    ("hyperliquid", os.path.join(EX, "hyperliquid.svg"),         3.594, 0.567, 1.00),
    ("okx",         os.path.join(EX, "okx.svg"),                 3.556, 1.000, 1.00),
    ("kalshi",      os.path.join(EX, "kalshi.svg"),              3.850, 1.000, 1.00),
    ("polymarket",  os.path.join(ASSETS, "polymarket-black.svg"),4.404, 0.590, 0.92),
]

T = 17.0        # target visual letter height (logical px)
GAP = 22.0      # gap between logos
PAD = 14.0      # padding around row
MAXW = 552.0    # max visible width (logical) to fit a 600px email column
SCALE = 2       # device scale factor

def datauri(path):
    with open(path, "rb") as f:
        return "data:image/svg+xml;base64," + base64.b64encode(f.read()).decode()

# box height per logo to equalize visual letter height
boxes = {n: (T * mult) / frac for (n, p, asp, frac, mult) in LOGOS}
widths = {n: boxes[n] * asp for (n, p, asp, frac, mult) in LOGOS}

total_w = sum(widths.values()) + GAP * (len(LOGOS) - 1) + 2 * PAD
gscale = min(1.0, MAXW / total_w)

boxes = {k: v * gscale for k, v in boxes.items()}
widths = {k: v * gscale for k, v in widths.items()}
gap = GAP * gscale
pad = PAD * gscale

row_h = max(boxes.values()) + 2 * pad
row_w = sum(widths.values()) + gap * (len(LOGOS) - 1) + 2 * pad

imgs = "\n".join(
    f'    <img src="{datauri(p)}" alt="{n}" style="height:{boxes[n]:.3f}px;width:auto;display:block">'
    for (n, p, asp, frac, mult) in LOGOS
)
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;padding:0;background:#ffffff}}
#row{{display:inline-flex;align-items:center;gap:{gap:.3f}px;padding:{pad:.3f}px;background:#ffffff}}
</style></head><body><div id="row">
{imgs}
</div></body></html>"""

hp = os.path.join(BASE, "markets-row.html")
with open(hp, "w") as f:
    f.write(html)

winW = math.ceil(row_w) + 4
winH = math.ceil(row_h) + 4
subprocess.run([CHROME, "--headless=new", f"--force-device-scale-factor={SCALE}",
                "--default-background-color=00000000",
                f"--screenshot={OUT}", f"--window-size={winW},{winH}", hp],
               stderr=subprocess.DEVNULL, check=True)

# tight crop to non-white content, add small uniform white margin
im = Image.open(OUT).convert("RGB")
W, H = im.size
px = im.load()
def nonwhite(x, y):
    r, g, b = px[x, y]
    return not (r > 250 and g > 250 and b > 250)
xs = [x for x in range(W) for y in range(0, H, 3) if nonwhite(x, y)]
ys = [y for y in range(H) for x in range(0, W, 3) if nonwhite(x, y)]
if xs and ys:
    m = int(round(pad * SCALE))
    l = max(0, min(xs) - m); r = min(W, max(xs) + 1 + m)
    t = max(0, min(ys) - m); btm = min(H, max(ys) + 1 + m)
    crop = Image.new("RGB", (r - l, btm - t), (255, 255, 255))
    crop.paste(im.crop((l, t, r, btm)), (0, 0))
    crop.save(OUT)
    fw, fh = crop.size
else:
    fw, fh = W, H

print(f"gscale={gscale:.3f}  visible_logical={row_w:.1f}x{row_h:.1f}")
print(f"final PNG = {fw}x{fh}  (logical ~{fw//SCALE}x{fh//SCALE})")
