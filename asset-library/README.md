# NickAI asset library

Shared, reusable brand assets for the whole team, across every channel (social, video, email, decks). Source-of-truth pulled from the live site (`getnickai/nicksitev2`), so everything here matches the real design system.

## Brand basics

- **Primary blue:** `#0178FF` (`--primary-base`). Darker `#0169E0`, lighter `#389CFF`.
- **Text (dark on light):** `#12151C` headings, `#5B6472` secondary.
- **Heading / wordmark font:** Duplet Semibold. Body: Duplet Regular. (`brand/fonts/`)
- **Do not** use `#0892F5` for the logo. That blue is only the app favicon square, not the brand blue.

## What's here

```
brand/
  logos/
    mark-blue.svg              node mark in brand blue (#0178FF)
    mark-white-N-on-blue.svg   app icon: white N on the blue square
  textures/
    silk-deco.jpg              the "Got questions?" blue silk (2544x1904)
    silk-dark.jpg              dark silk with blue beam
  fonts/
    Duplet-{Regular,Semibold,Bold}.woff
covers/
  cover-template.html          text-swappable social / video cover
  make-cover.sh                one-line renderer
  src/                         assets the template loads
  example-og.png              sample output (the site OG image)
```

## Covers: make one in one line

The cover template is the NickAI split layout (logo + headline + subtitle + CTA chip on the left, silk block with the N on the right). Only the text changes.

```bash
cd covers
./make-cover.sh "Title" "Subtitle" [og|wide|square] [output.png] [cta]
```

Sizes:
- `og` 1200x630 (default) social share / OpenGraph
- `wide` 1920x1080 (16:9) video / YouTube cover
- `square` 1080x1080 Instagram

Examples:

```bash
./make-cover.sh "Nick now trades Polymarket" "Prediction markets, in plain English"
./make-cover.sh "Rebalance while you sleep" "Set a rule, Nick runs it every day" wide yt-cover.png
./make-cover.sh "Ask Nick anything" "Research any market in plain English" square ig.png
```

Any blank argument falls back to the default brand copy. The CTA chip defaults to `Try for free at getnick.ai`.

Requires macOS with Google Chrome (renders headless). No other dependencies.

## Notes

- The site OG image (`public/og.png` in nicksitev2) is produced from this template at `og` size.
- To change the layout for everyone, edit `covers/cover-template.html`. The design lives on a fixed 1200x630 stage that scales to any output size, so one edit updates all formats.
