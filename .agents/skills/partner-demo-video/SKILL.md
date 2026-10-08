---
name: partner-demo-video
description: >-
  Turn a raw NickAI screen recording into a narrated partner/integration demo
  video (the OKX and outcome.xyz walkthrough format): title card, "You asked"
  prompt bar, captions, ElevenLabs narration, ducked music, sped-up waits,
  "Part 2 · Automate it" workflow section, outro with the approved CTA, and a
  cover frame that previews correctly in WhatsApp/Slack. Use whenever someone
  shares a screen recording of Nick and asks to "edit this into a demo",
  "make a video for <partner>", "cut my recording", "add voiceover/music",
  "speed up the workflow part", or wants the same look as the OKX /
  outcome.xyz videos. Engine: scripts/demo-video/demo_video.py; one JSON
  config per video in data/demo-videos/.
---

# Partner demo video

Every partner demo should look and sound the same, whoever edits it. This skill
is the house format. The reference edit is `data/demo-videos/outcome-xyz.json`.

## What you need
- The screen recording (any size; the browser content area is cropped and fit
  into a 1920x880 band between a 100px top bar and a 100px caption bar).
- `ffmpeg`, `python3`, Google Chrome (overlays are HTML screenshots; override
  with `CHROME_PATH`). Run from the repo root.
- ElevenLabs access for narration and music (see step 4).

## The format (don't drift from it)
- **Intro card**: Nick mark, kicker `NickAI × <partner>`, two-line headline with
  the second line in accent blue, one-line subtitle. It is frame 0 with no
  fade-in, so chat apps show it as the preview instead of a black frame. It is
  also embedded as cover art and exported as `<name>-cover.png`.
- **Part 1 · Trade by talking**: one block per prompt. Top bar shows
  `NickAI | You asked | <prompt verbatim> | Part 1`. Typing and "Thinking..."
  are compressed (`fit`), answers, approvals and exchange confirmations play in
  real time (`x1`). Cut away to the partner's own site when it shows the order
  or position landing; it proves the integration.
- **Bridge card** "Part 2 · Automate it with a workflow" voiced by one line.
- **Part 2 · Automate it**: the workflow prompt (long chip), the build sped up
  heavily (aim for ~8x and under ~40s, a "Sped up ⏩" pill appears on any segment
  faster than 3x), then Nick's final answer in real time.
- **Outro card**: headline + accent line, CTA button `Try it for free now` +
  `getnick.ai`, fine print.
- **Audio**: narration on every block, music bed ducked under the voice,
  loudness normalized to -16 LUFS.

## Workflow

1. **Find the timestamps.** Make contact sheets and read them:
   `python3 scripts/demo-video/demo_video.py sheet <recording> --every=3`
   (add `--crop=W:H:X:Y` to zoom on the chat column). For each prompt note when
   it is sent, when the answer/approval card appears, when it finishes, and any
   cut-aways (partner site, explorer). Check the end of the recording for error
   toasts and stop before them.

2. **Find the crop.** Grab one full-res frame and measure the browser content
   area below the URL bar: `[width, height, x, y]` in source pixels. The outcome
   recording (3050x2064 window capture) uses `[2824, 1666, 112, 250]`.

3. **Write the config** by copying `data/demo-videos/outcome-xyz.json`:
   - `blocks[]`: `prompt` (verbatim from the recording, typos tidied), `part`,
     `segs` (`["fit", a, b, out_secs]` or `["x1", a, b]`, source seconds),
     `lines` (`[line_id, segment_index]`: the line starts at that segment or
     right after the previous line), `lim` (latest source second the last `x1`
     may extend to before the engine freezes the last frame).
     A bridge is `{ "card": "bridge", "line": "B0" }`.
   - `lines`: one short sentence or two per block. Narrate what the viewer
     should notice, not what is on screen word for word.
   - `cards`: intro, bridge, outro copy.
   - **All copy follows `docs/nickai-content-guide.md`**: no em/en-dashes, no
     returns/profit/win/beat/guaranteed (say "P&L", not "profit"), Nick is
     "it", CTA `Try it for free now: getnick.ai`.

4. **Generate narration and music** into `out/demo-video/<name>/`:
   - One MP3 per line at `vo/<LINE_ID>.mp3`.
   - ElevenLabs model **`eleven_v4`**, voice **Louis - Friendly Instructor**
     (`MlIxnl4hUPbFzWffsZ76`), **plain text**. Write `outcome.xyz`, `BTC`, `P&L`
     as-is: v4 reads acronyms and domains correctly. Do not respell them or use
     IPA; that was A/B tested and plain v4 won. `eleven_multilingual_v2`
     stumbles on acronyms, avoid it.
   - Music: ElevenLabs music (`eleven_music_v2_5`), instrumental, ~30s longer
     than the video, saved as `music.mp3`. The reference prompt is
     `music_prompt` in the outcome config. Check it has no vocals (a
     speech-to-text pass should come back empty).
   - In Claude Code with the ElevenLabs connector: `creative_generate_speech`
     (generations_count 1) per line, poll `creative_get_flow_run_status`,
     `curl` each `media[].url` to its `vo/<ID>.mp3`. Without the connector,
     generate the same lines in the ElevenLabs app and save them with those names.

5. **Plan, then render.**
   `python3 scripts/demo-video/demo_video.py plan data/demo-videos/<name>.json`
   prints each block's on-screen time and where every line lands. Check that
   lines land on the moment they describe (e.g. "there's the position" starts as
   the partner page appears) and adjust `segs` before rendering.
   `python3 scripts/demo-video/demo_video.py render data/demo-videos/<name>.json --source=<recording>`
   writes `<name>.mp4` (+ embedded cover) and `<name>-cover.png`. Segments are
   cached, so re-renders after copy or narration changes take about a minute;
   `--fresh` rebuilds everything.

6. **Review before sending.** Contact-sheet the output
   (`sheet out/demo-video/<name>/<name>.mp4 --every=10`): the long workflow
   prompt chip must not collide with the "Sped up" pill, captions must fit on
   two lines, frame 0 must be the title card.

## Gotchas
- The first frame is what WhatsApp/Slack show. Never fade in from black.
- Keep the recording, renders and MP3s out of git: everything under `out/` is
  ignored. Commit only the config.
- If a narration line runs longer than its footage, `plan` shows `+hold`: the
  engine freezes the last frame. Prefer shortening the line or giving the block
  more source time.
