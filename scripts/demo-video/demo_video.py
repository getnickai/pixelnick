"""Partner demo video: turn a raw NickAI screen recording into a narrated walkthrough.

One JSON config per video (see data/demo-videos/*.json) describes the edit:
  - which source seconds to keep, compress ("fit") or play in real time ("x1")
  - the prompt shown in the "You asked" bar for each block
  - narration lines (one MP3 per line, generated with ElevenLabs) and where they start
  - copy for the intro, bridge and outro cards

  python3 scripts/demo-video/demo_video.py sheet  <recording> [--every=3] [--crop=W:H:X:Y]
  python3 scripts/demo-video/demo_video.py plan   <config.json>
  python3 scripts/demo-video/demo_video.py render <config.json> --source=<recording> [--fresh]

Work files and output land in out/demo-video/<name>/ (gitignored). Narration MP3s go in
out/demo-video/<name>/vo/<LINE_ID>.mp3 and the music bed in out/demo-video/<name>/music.mp3.
Needs ffmpeg and Google Chrome (overlays are rendered as HTML screenshots). See
.claude/skills/partner-demo-video/SKILL.md for the full workflow.
"""
import json
import os
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CHROME = os.environ.get("CHROME_PATH", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
W, H, BAR = 1920, 1080, 100  # output frame; content band is W x (H - 2*BAR)
BAND_H = H - 2 * BAR
GAP = 0.35  # silence between narration lines


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def dur(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(out.decode())


def arg(flag, default=None):
    for a in sys.argv:
        if a.startswith(flag + "="):
            return a[len(flag) + 1:]
    return default


# ---------------------------------------------------------------- timeline

def seg_len(s):
    """Output seconds of a segment. ("fit", a, b, secs) | ("x1", a, b[, hold]) | ("card", name, secs)."""
    if s[0] == "card":
        return s[2]
    if s[0] == "fit":
        return s[3]
    return (s[2] - s[1]) + (s[3] if len(s) > 3 else 0)


def load(path):
    cfg = json.load(open(path))
    work = os.path.join(REPO, "out", "demo-video", cfg["name"])
    vo = {k: os.path.join(work, "vo", k + ".mp3") for k in cfg["lines"]}
    missing = [k for k, p in vo.items() if not os.path.exists(p)]
    if missing:
        sys.exit(f"missing narration MP3s in {work}/vo/: {', '.join(missing)}")
    cfg["_work"], cfg["_vo"] = work, {k: dur(p) for k, p in vo.items()}
    blocks = []
    for b in cfg["blocks"]:
        b = dict(b)
        if "card" in b:
            b["segs"] = [["card", b["card"], cfg["_vo"][b["line"]] + 0.9]]
            b["lines"] = [[b["line"], 0]]
        b["segs"] = [list(s) for s in b["segs"]]
        blocks.append(b)
    cfg["_blocks"] = blocks
    return cfg


def solve(cfg):
    """Place narration; grow a block's last x1 segment (up to `lim`, then freeze-frame) until its lines fit."""
    VO, blocks = cfg["_vo"], cfg["_blocks"]
    intro_id, outro_id = cfg["intro_line"], cfg["outro_line"]
    intro = VO[intro_id] + 0.9
    for _ in range(80):
        t, prev_end, placed, changed = intro, 0.3 + VO[intro_id], [(intro_id, 0.3)], False
        for b in blocks:
            starts, acc = [], t
            for s in b["segs"]:
                starts.append(acc)
                acc += seg_len(s)
            for name, si in b["lines"]:
                st = max(starts[si] + (0.25 if si == 0 else 0.1), prev_end + GAP)
                placed.append((name, st))
                prev_end = st + VO[name]
            need = prev_end + 0.5 - acc
            if need > 0.01:
                last = b["segs"][-1]
                if last[0] == "card":
                    last[2] += need
                else:
                    grow = min(need, b.get("lim", last[2]) - last[2])
                    if grow > 0.01:
                        last[2] += grow
                        need -= grow
                    if need > 0.01:
                        if len(last) > 3:
                            last[3] += need
                        else:
                            last.append(need)
                changed = True
            b["t0"], b["t1"], b["starts"] = t, acc, starts
            t = acc
        if not changed:
            break
    placed.append((outro_id, t + 0.5))
    outro = VO[outro_id] + 1.8
    return placed, intro, t, t + outro


# ---------------------------------------------------------------- overlays

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")


def page(body):
    fonts, f = os.path.join(REPO, "public", "fonts"), "file://"
    return f"""<html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Duplet; src: url('{f}{fonts}/Duplet-Semibold.woff'); font-weight: 600; }}
@font-face {{ font-family: Duplet; src: url('{f}{fonts}/Duplet-Regular.woff'); font-weight: 400; }}
@font-face {{ font-family: Manrope; src: url('{f}{fonts}/Manrope-400.woff2'); font-weight: 400; }}
@font-face {{ font-family: Manrope; src: url('{f}{fonts}/Manrope-500.woff2'); font-weight: 500; }}
@font-face {{ font-family: Manrope; src: url('{f}{fonts}/Manrope-600.woff2'); font-weight: 600; }}
html,body {{ margin:0; background:transparent; width:{W}px; height:{H}px; overflow:hidden; font-family: Manrope, sans-serif; color:#fafafa; -webkit-font-smoothing:antialiased; }}
.top {{ position:absolute; left:0; right:0; top:0; height:{BAR}px; background:#09090b; display:flex; align-items:center; gap:22px; padding:0 40px; box-sizing:border-box; border-bottom:1px solid #202023; }}
.bug {{ display:flex; align-items:center; gap:12px; font:600 26px Duplet; letter-spacing:-0.02em; flex:none; }}
.bug img {{ width:30px; height:30px; }}
.sep {{ width:1px; height:36px; background:#2a2a2f; flex:none; }}
.lbl {{ font:500 18px Manrope; color:#71717a; flex:none; }}
.chip {{ font:500 22px Manrope; color:#fafafa; background:#18181b; border:1px solid #2a2a2f; border-radius:12px; padding:12px 18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:1100px; }}
.chip.long {{ white-space:normal; font-size:16px; line-height:1.35; padding:8px 14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }}
.part {{ margin-left:auto; font:500 17px Manrope; color:#a1a1aa; flex:none; }}
.ff {{ margin-left:auto; margin-right:250px; font:500 18px Manrope; color:#a1a1aa; border:1px solid #2a2a2f; border-radius:999px; padding:8px 14px; flex:none; }}
.bot {{ position:absolute; left:0; right:0; bottom:0; height:{BAR}px; background:#09090b; border-top:1px solid #202023; display:flex; align-items:center; justify-content:center; }}
.cap {{ font:500 32px Manrope; letter-spacing:-0.01em; max-width:1700px; text-align:center; }}
.card {{ position:absolute; inset:0; background:#09090b; display:flex; flex-direction:column; align-items:center; justify-content:center; }}
.card .logo {{ width:84px; height:84px; }}
.card .kicker {{ font:500 24px Manrope; color:#a1a1aa; margin-top:36px; }}
.card h1 {{ font:600 84px/1.05 Duplet; letter-spacing:-0.045em; margin:16px 0 0; text-align:center; }}
.card h1 span {{ color:#33c4ff; }}
.card .sub {{ font:500 26px Manrope; color:#a1a1aa; margin-top:26px; }}
.card .cta {{ display:flex; gap:22px; align-items:center; margin-top:44px; }}
.card .btn {{ font:600 26px Manrope; background:#0178ff; color:#fff; padding:18px 30px; border-radius:16px; }}
.card .fine {{ position:absolute; bottom:36px; font:500 16px Manrope; color:#52525b; }}
</style></head><body>{body}</body></html>"""


def card_html(c):
    logo = f'<img class="logo" src="file://{REPO}/public/nick/nick-mark.svg">' if c.get("logo", True) else ""
    kicker = f'<div class="kicker">{esc(c["kicker"])}</div>' if c.get("kicker") else ""
    accent = f'<br><span>{esc(c["accent"])}</span>' if c.get("accent") else ""
    sub = f'<div class="sub">{esc(c["sub"])}</div>' if c.get("sub") else ""
    cta = (f'<div class="cta"><div class="btn">{esc(c["cta"])}</div><div class="sub" style="margin:0">{esc(c.get("url", ""))}</div></div>'
           if c.get("cta") else "")
    fine = f'<div class="fine">{esc(c["fine"])}</div>' if c.get("fine") else ""
    return page(f'<div class="card">{logo}{kicker}<h1>{esc(c["title"])}{accent}</h1>{sub}{cta}{fine}</div>')


def png(ov, name, html):
    p = os.path.join(ov, name + ".html")
    open(p, "w").write(html)
    out = os.path.join(ov, name + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--default-background-color=00000000", f"--window-size={W},{H}", f"--screenshot={out}", f"file://{p}"],
                   capture_output=True)
    if not os.path.exists(out):
        sys.exit(f"Chrome did not render {out}; set CHROME_PATH")
    return out


# ---------------------------------------------------------------- commands

def cmd_sheet():
    """Contact sheets of the recording (one tile every N seconds) for finding prompt/answer timestamps."""
    src = os.path.abspath(sys.argv[2])
    every = float(arg("--every", "3"))
    crop = arg("--crop")
    out = os.path.join(REPO, "out", "demo-video", "sheets", os.path.splitext(os.path.basename(src))[0])
    os.makedirs(out, exist_ok=True)
    vf = (f"crop={crop}," if crop else "") + f"fps=1/{every},scale=480:-1,tile=5x4"
    ff("-i", src, "-vf", vf, os.path.join(out, "sheet_%02d.jpg"))
    print(f"sheets in {out}: tile k (0-based, left to right, top to bottom) of sheet n (1-based) "
          f"is about t = ((n-1)*20 + k) * {every}s")


def cmd_plan():
    cfg = load(sys.argv[2])
    placed, intro, end, total = solve(cfg)
    for b in cfg["_blocks"]:
        label = b.get("prompt") or f"[{b.get('card')} card]"
        print(f"{b['t0']:6.1f}-{b['t1']:6.1f}  {label[:44]:<44} " + " ".join(
            f"{s[0]}[{s[1]}-{s[2]:.1f}{'+hold %.1f' % s[3] if s[0] == 'x1' and len(s) > 3 else ''}]" if s[0] != "card" else f"card[{s[2]:.1f}s]"
            for s in b["segs"]))
    for n, st in placed:
        print(f"  VO {n:5s} {st:6.1f} -> {st + cfg['_vo'][n]:6.1f}")
    print(f"total {total:.1f}s")


def cmd_render():
    cfg = load(sys.argv[2])
    src = arg("--source")
    if not src or not os.path.exists(src):
        sys.exit("pass --source=<path to the screen recording>")
    work, VO, fps = cfg["_work"], cfg["_vo"], cfg.get("fps", 60)
    music = os.path.join(work, "music.mp3")
    if not os.path.exists(music):
        sys.exit(f"missing music bed: {music}")
    ov, seg = os.path.join(work, "ov"), os.path.join(work, "seg")
    os.makedirs(ov, exist_ok=True)
    os.makedirs(seg, exist_ok=True)
    placed, intro_len, content_end, total = solve(cfg)
    blocks = cfg["_blocks"]
    cw, ch, cx, cy = cfg["crop"]
    fit = f"crop={cw}:{ch}:{cx}:{cy},scale=-2:{BAND_H}:flags=lanczos,pad={W}:{BAND_H}:(ow-iw)/2:0:color=0x09090b"
    logo = f"file://{REPO}/public/nick/nick-mark.svg"

    overlays = []  # (png, t0, t1)
    ffpill = png(ov, "ff", page('<div class="top" style="background:transparent;border:none"><div class="ff">Sped up ⏩</div></div>'))
    blank = png(ov, "bars", page('<div class="bot"></div>'))
    for i, b in enumerate(blocks):
        if "card" in b:
            continue
        chip = f'<div class="chip{" long" if b.get("long") else ""}">{esc(b["prompt"])}</div>'
        top = (f'<div class="top"><div class="bug"><img src="{logo}">NickAI</div><div class="sep"></div>'
               f'<div class="lbl">You asked</div>{chip}<div class="part">{esc(b.get("part", ""))}</div></div>')
        overlays.append((png(ov, f"top{i:02d}", page(top)), b["t0"], b["t1"]))
        overlays.append((blank, b["t0"], b["t1"]))
        for k, s in enumerate(b["segs"]):
            if s[0] == "fit" and (s[2] - s[1]) / s[3] > 3:
                overlays.append((ffpill, b["starts"][k], b["starts"][k] + s[3]))
    card_lines = {cfg["intro_line"], cfg["outro_line"]} | {b["line"] for b in blocks if "card" in b}
    for name, st in placed:
        if name not in card_lines:
            cap = f'<div class="bot"><div class="cap">{esc(cfg["lines"][name])}</div></div>'
            overlays.append((png(ov, f"cap_{name}", page(cap)), st, st + VO[name] + 0.25))
    cards = {k: png(ov, f"card_{k}", card_html(c)) for k, c in cfg["cards"].items()}

    # video segments (cached by duration)
    files = []
    for n, s in enumerate(x for b in blocks for x in b["segs"]):
        f = os.path.join(seg, f"s{n:03d}.mp4")
        files.append(f)
        out_len = seg_len(s)
        if os.path.exists(f) and "--fresh" not in sys.argv and abs(dur(f) - out_len) < 0.05:
            continue
        enc = ["-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-r", str(fps), f]
        if s[0] == "card":
            ff("-loop", "1", "-framerate", str(fps), "-t", f"{out_len:.3f}", "-i", cards[s[1]],
               "-vf", f"crop={W}:{BAND_H}:0:{BAR},fade=t=in:st=0:d=0.4,fade=t=out:st={out_len - 0.4:.3f}:d=0.4,format=yuv420p", *enc)
            continue
        hold = s[3] if s[0] == "x1" and len(s) > 3 else 0
        speed = (s[2] - s[1]) / (out_len - hold)
        vf = f"{fit},setpts=(PTS-STARTPTS)/{speed:.5f},fps={fps}"
        if hold:
            vf += f",tpad=stop_mode=clone:stop_duration={hold + 0.5:.3f}"
        ff("-ss", f"{s[1]:.3f}", "-to", f"{s[2] + 0.2:.3f}", "-i", src, "-vf", vf + f",trim=duration={out_len:.4f},format=yuv420p", *enc)
    lst = os.path.join(seg, "list.txt")
    open(lst, "w").write("\n".join(f"file '{f}'" for f in files))
    content = os.path.join(work, "content.mp4")
    ff("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", content)

    # compose: intro card (no fade-in, so frame 0 is the title card for chat-app previews), body, outro
    outro_len = total - content_end
    inputs = ["-loop", "1", "-t", f"{intro_len:.3f}", "-framerate", str(fps), "-i", cards["intro"], "-i", content,
              "-loop", "1", "-t", f"{outro_len:.3f}", "-framerate", str(fps), "-i", cards["outro"]]
    fc = [f"[0:v]format=yuv420p,fade=t=out:st={intro_len - 0.4:.3f}:d=0.4[intro]",
          f"[1:v]pad={W}:{H}:0:{BAR}:color=#09090b,format=yuv420p,fade=t=in:st=0:d=0.4[body]",
          f"[2:v]format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st={outro_len - 0.8:.3f}:d=0.8[outro]",
          "[intro][body][outro]concat=n=3:v=1:a=0[base]"]
    for b in blocks:  # full-frame cards also cover the bars
        if "card" in b:
            overlays.append((cards[b["card"]], b["t0"], b["t1"]))
    last = "base"
    for i, (p, a, b2) in enumerate(overlays):  # all times are on the final timeline (solve() starts after the intro)
        inputs += ["-i", p]
        fc.append(f"[{last}][{3 + i}:v]overlay=0:0:enable='between(t,{a:.3f},{b2:.3f})'[v{i}]")
        last = f"v{i}"
    base = 3 + len(overlays)
    labels = []
    for j, (name, st) in enumerate(placed):
        inputs += ["-i", os.path.join(work, "vo", name + ".mp3")]
        ms = int(st * 1000)
        fc.append(f"[{base + j}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[vo{j}]")
        labels.append(f"[vo{j}]")
    fc.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad=whole_dur={total:.3f}[voice]")
    inputs += ["-stream_loop", "-1", "-i", music]
    m = base + len(placed)
    vol = cfg.get("music_volume", 0.32)
    fc.append(f"[{m}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},volume={vol},"
              f"afade=t=in:d=1.5,afade=t=out:st={total - 3:.3f}:d=3[mus]")
    fc.append("[voice]asplit=2[va][vsc]")
    fc.append("[mus][vsc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=500[duck]")
    fc.append("[va][duck]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=9[aout]")
    raw = os.path.join(work, "render.mp4")
    ff(*inputs, "-filter_complex", ";".join(fc), "-map", f"[{last}]", "-map", "[aout]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", raw)

    # embed the intro card as cover art and export it for posting
    out = os.path.join(work, cfg["name"] + ".mp4")
    cover = os.path.join(work, cfg["name"] + "-cover.png")
    subprocess.run(["cp", cards["intro"], cover], check=True)
    ff("-i", raw, "-i", cover, "-map", "0", "-map", "1", "-c", "copy", "-c:v:1", "png",
       "-disposition:v:1", "attached_pic", "-movflags", "+faststart", out)
    json.dump({"total": round(total, 2),
               "voice": [{"line": n, "t": round(st, 2), "dur": round(VO[n], 2), "text": cfg["lines"][n]} for n, st in placed],
               "blocks": [{"prompt": b.get("prompt"), "t0": round(b["t0"], 2), "t1": round(b["t1"], 2), "segs": b["segs"]} for b in blocks]},
              open(os.path.join(work, "edl.json"), "w"), indent=1)
    print(f"done: {out} ({total:.1f}s)\ncover: {cover}")


if __name__ == "__main__":
    cmds = {"sheet": cmd_sheet, "plan": cmd_plan, "render": cmd_render}
    if len(sys.argv) < 3 or sys.argv[1] not in cmds:
        sys.exit(__doc__)
    cmds[sys.argv[1]]()
