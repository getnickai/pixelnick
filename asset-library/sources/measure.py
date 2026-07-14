#!/usr/bin/env python3
import base64, os, subprocess
from PIL import Image

BASE = "/private/tmp/claude-501/-Users-badi-claude/c59406a6-8daa-4ccb-b45d-260e3c44b75b/scratchpad"
EX = os.path.join(BASE, "nicksitev2/public/brand/exchanges")
ASSETS = os.path.join(BASE, "assets")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

LOGOS = [
    ("coinbase",    os.path.join(EX, "coinbase.svg")),
    ("hyperliquid", os.path.join(EX, "hyperliquid.svg")),
    ("okx",         os.path.join(EX, "okx.svg")),
    ("kalshi",      os.path.join(EX, "kalshi.svg")),
    ("polymarket",  os.path.join(ASSETS, "polymarket-black.svg")),
]

def datauri(path):
    with open(path, "rb") as f:
        return "data:image/svg+xml;base64," + base64.b64encode(f.read()).decode()

# Render each alone at box-height 120px (logical), measure black-pixel bbox height.
RENDER_H = 120
results = {}
for name, p in LOGOS:
    html = f'<!doctype html><html><head><style>html,body{{margin:0;padding:0;background:#fff}}img{{display:block;height:{RENDER_H}px;width:auto}}</style></head><body><img src="{datauri(p)}"></body></html>'
    hp = os.path.join(BASE, f"_m_{name}.html")
    op = os.path.join(BASE, f"_m_{name}.png")
    with open(hp, "w") as f:
        f.write(html)
    subprocess.run([CHROME, "--headless=new", "--force-device-scale-factor=1",
                    f"--screenshot={op}", "--window-size=1200,300", hp],
                   stderr=subprocess.DEVNULL, check=True)
    im = Image.open(op).convert("L")
    W, H = im.size
    px = im.load()
    top, bot = None, None
    for y in range(H):
        row_has = any(px[x, y] < 128 for x in range(0, W, 2))
        if row_has:
            if top is None: top = y
            bot = y
    cap = (bot - top + 1) if top is not None else 0
    results[name] = cap
    print(f"{name:12s} box={RENDER_H}px -> cap={cap}px  (cap/box={cap/RENDER_H:.3f})")

# Save ratios
import json
with open(os.path.join(BASE, "_capratios.json"), "w") as f:
    json.dump({k: v/RENDER_H for k, v in results.items()}, f)
