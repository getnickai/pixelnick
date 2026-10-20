# Nick brand system v1.0 (Fountible "Nick DS")

Source: Fountible file **Nick DS** (`j3Ptl4-1htV9`), page **Components** (`ZtgEHPDpLHpkb5exYYa-l`).
Extracted 2026-10-20, read-only (only `list_*`, `read_*`, `screenshot_*` tools were called).
Quoted board text below is verbatim, including the file's own punctuation.

## Boards on the Components page

| Node | Name | Size |
|-|-|-|
| `9nhVkQ3pyUxoW6qE3LNGO` | Nick — Logo system | 1440×6400 |
| `JzMroALMMFIPcAk8SQyBw` | NickAI — Logo system | 1440×6400 |
| `FkI64SIQXD3KRLsZzhFz5` | Logo full (loose instance, Variant=Light) | 112×24 |
| `KCYnwMuMhFA9GP6BlsUVS` | File thumbnail | 1024×768 |

Other pages (Intros, Dump, Franklin's, Onboarding, Catalyst) hold videos and screenshots, not brand rules. Their top-level outline is in `outline.json`.

## Components

| Component id | Name | Main node | Size | Instances | Variants |
|-|-|-|-|-|-|
| `fBe0rTDYUTvZ50l_I4OTM` | **Logo Only Nick** | `QMGka-V4sd4KNDvkYLIc6` | 220×58 | 43 | none |
| `Kc0HaY76gsy8XQKzLVTQ-` | **Logo full** (NickAI) | `qnwR0zgFb2doqZji-7XX0` | 112×24 | 45 | Variant = Light (default), Dark (preview `ClhT372WmfD7VNX-YzZwP`) |

Both components share one mark path (the "Union" vector, viewBox `0 0 23.2 23.33`). The Nick wordmark ("Nick" vector) is viewBox `0 0 55 18.67`; the NickAI wordmark is `0 0 78.38 18.67` and is the Nick path plus the "AI" glyphs.

Every logo on both boards is an instance of its component restyled with overrides (fill colour, layer hidden, layer moved). Across all 34 nodes read, every path string was byte-identical to the component mains; only fills, strokes, sizes and positions differ.

## Nick — Logo system board (verbatim)

### Header
- File meta: "Brand · Components · v1.0"
- Title: "Nick logo system"
- Intro: "One component, every variation. Each logo on this board is an instance of Logo Only Nick, restyled with overrides: copy the one you need, or adjust an instance's layers."
- Source card: "Source" / "Component: Logo Only Nick · Mark shared with NickAI (logo-icon.tsx) · Wordmark not in code yet"
- Logo palette:

| Chip | Value |
|-|-|
| Brand blue | #0178FF · primary-base |
| Ink | #09090B · text-strong-950 |
| Paper | #FFFFFF · bg-white-0 |
| Muted | #A1A1AA · icon-soft-400 |

### 01 — Full logo
"The primary lockup, mark and wordmark together. Use it wherever there's room: app header, marketing, docs. Blue mark on light or dark; for the mono versions, recolour both layers of the instance." Source label: "Component · Logo Only Nick"

| Swatch | Spec (verbatim) | Surface | Instance |
|-|-|-|-|
| On light | Mark #0178FF · Type #09090B | #FAFAFA | `_Np5B9ijNHP4c8dp0sD_c` 228×60 |
| On dark | Mark #0178FF · Type #FFFFFF | #09090B | `mRx4R1PVc9rVAr1BuPVk6` 228×60 |
| Mono ink | #09090B | #FAFAFA | `BDvV_pB_VyjlRWPsmNVoH` 182×48 |
| Mono white | #FFFFFF | #09090B | `wjB2wYd1rd1vvBHErjCPQ` 182×48 |
| Reversed on brand | #FFFFFF on #0178FF | #0178FF | `wtyILn68PENr6ctxIRoTG` 182×48 |

Lockup geometry (percent of instance box): mark left 0, top -0.29%, width 26.36%, height 100.55%; wordmark left 37.72%, top 9.76%, width 62.49%, height 80.45%. At 24px tall the lockup is 91.03px wide.

### 02 — Logo mark
"The N-node symbol on its own, for avatars, favicons, the collapsed sidebar and loaders. Logo Only Nick with the wordmark hidden and the mark filling the frame. Same mark as NickAI." Source label: "Shared with NickAI · logo-icon.tsx"

| Swatch | Spec | Instance (64×64) |
|-|-|-|
| Brand on light | #0178FF | `MQE4bUeLAV-_T8l5QBp5e` |
| Brand on dark | #0178FF | `Mw6JzEBmmqW5CvTVr2A4y` |
| Ink on light | #09090B | `Qe8HXhEkUJZKshh-l96Qb` |
| White on dark | #FFFFFF | `CS356u-wtG2X_3JWodYzF` |
| Muted · page loader | #A1A1AA | `uphd1DU3jF0pP8M2MuhXM` |
| Outline on light | stroke #09090B | `_yOkO2gshhxwHc42-97eq` |
| Outline on dark | stroke #FFFFFF | `bT58uULRPfEsCxXTpYyNe` |
| Size ramp | 16–44 px | `xXgXQP7aLKdPv-1LkchFX` |

Size ramp labels: 16, "20 · sidebar", 24, 32, "44 · auth".
Outline variant: fill none, stroke-width 1.68 (viewBox units), round caps and joins, mark inset 4.69% with width 86.13% and height 86.63%. (The NickAI board labels the same variant "Stroke 1.5".)
Filled mark inside a square frame: inset top 1.4%, left 1.67%, width 96.67%, height 97.21%.

### 03 — Logo type
"The Nick wordmark alone, for text-led layouts or when the mark already sits nearby. Logo Only Nick with the mark hidden. It is drawn lettering: never re-type “Nick” in a font." Source label: "NickAI lettering · not in code yet"

| Swatch | Spec | Instance (165×56) |
|-|-|-|
| Ink on light | #09090B on #FAFAFA | `otzCRBA__wK74JzRuN5O_` |
| White on dark | #FFFFFF on #09090B | `SVXn35XSvcMKScG69LDkU` |
| Brand on light | #0178FF on #FAFAFA | `ybooR9eDfwWRQGUlzyfmu` |
| White on brand | #FFFFFF on #0178FF | `h9q3XbyNPhd9SlXC-lH3I` |

Usage note: "To pair the wordmark with the mark, use Logo Only Nick as it is instead of placing two copies side by side by hand."

### 04 — App icon
"The mark on a rounded tile for app icons, favicons, PWA installs and social avatars. Logo Only Nick with the wordmark hidden and the mark centred on a filled, rounded frame." Source label: "Same tile as NickAI · src/app/icon.tsx"

| Swatch | Spec (tile / mark) | Tile | Instance (128×128) |
|-|-|-|-|
| Brand tile · default | #0178FF / #FFFFFF | bg #0178FF | `NkcNfM-prog03OcVpWAEN` |
| Dark tile | #09090B / #0178FF | bg #09090B, 1px border #27272A | `DaCxp54o8HZ-uo9PJmZLR` |
| Light tile | #FFFFFF / #0178FF | bg #FFFFFF, 1px border #E4E4E7 | `W5xg9GbEuyxPH9Dn4zk-o` |

Size ramp: "16–128 px · radius 22.5% of tile" (items 16, 24, 32, 48, 64, 128).
Tile geometry: corner radius 22.5% of tile, overflow hidden; mark top 21.72%, left 21.88%, width 56.25%, height 56.56%.

### 05 — Stacked lockup
"The mark centred above the wordmark, for square and portrait spaces: splash screens, onboarding, slides, merch. Logo Only Nick with the mark moved above the wordmark." Source label: "Proposed · not in code yet"

| Swatch | Spec | Instance (138×150) |
|-|-|-|
| On light | Mark #0178FF · Type #09090B | `NnUwDkaB6wqkl9XR3-WS8` |
| On dark | Mark #0178FF · Type #FFFFFF | `vYIS9Ns1z1fUq-hQQl-Rn` |
| Mono ink | Mark #09090B · Type #09090B | `4MBFIMVsJwu0ajCxQuPGm` |
| Mono white | Mark #FFFFFF · Type #FFFFFF | `kNard0FGI6rafP7CKJ8k4` |

Geometry (137.5×149.6 box): mark left 22.73%, top 0, width 54.55%, height 50.42%; wordmark left 0, top 68.8%, width 100%, height 31.2%. The board screenshot shows "Mono white" on a #0178FF surface.

### 06 — Clear space & sizing
"Give the logo room and keep it legible. Keep clear space of x (half the logo height) on every side, and never go below the minimum sizes." Source label: "Applies to every variation above"

- Clear space: "x = ½ logo height" (demo logo 364×96, measure markers labelled "x").
- Minimum size: "≥ 16px tall"
  - "Header · 32px" (121×32)
  - "Default UI · 24px" (91×24)
  - "Minimum · 16px / 61px wide" (61×16)
  - "Below 16px tall, switch to the mark-only version (min 12px)."

Don'ts:

| Don't | Rule | What the example shows |
|-|-|-|
| Don't stretch | Lock proportions | logo forced to 260×48 |
| Don't rotate | Keep it level | logo rotated -12° |
| Don't recolour | Brand colours only | mark #A855F7, type #F97316 |
| Don't use low contrast | Min 3:1 | #D4D4D8 logo on #F4F4F5 |

## NickAI — Logo system board (differences only)

Same six sections and same colours, built on the **Logo full** component (NickAI wordmark).
- Title "Logo system". Intro: "One component, every variation. Each logo on this board is an instance of Logo full, restyled with overrides: copy the one you need, or adjust an instance's layers."
- Source paths: "nickai-app/src/common/client/logos/logo-full.tsx, logo-icon.tsx · common/client/icons.tsx (LogoStroke)"
- Colour note (verbatim): "Heads-up: in code, LogoFull, LogoIcon and the favicon (src/app/icon.tsx) still paint the mark #33C4FF. This file standardises on brand blue #0178FF (primary-base), as PapernickLogo already does."
- Section sources: 01 and 03 `src/common/client/logos/logo-full.tsx`; 02 `src/common/client/logos/logo-icon.tsx`; 04 `src/app/icon.tsx · public/logos/nickai.s…` (truncated in the outline); 05 "Proposed · not in code yet".
- Outline mark spec reads "Stroke 1.5 · #09090B" / "Stroke 1.5 · #FFFFFF".
- App icon specs are phrased mark-on-tile: "#FFFFFF on #0178FF", "#0178FF on #09090B", "#0178FF on #FFFFFF".
- Minimum size rows: 32px, 24px, 16px; same "Below 16px tall" note.
- NickAI lockup geometry (111.87×24): mark top 1.39%, width 20.74%, height 97.21%; wordmark left 29.67%, top 11.11%, width 70.06%, height 77.77%.

## Tokens (`tokens.json`)

46 colour variables. The ones the logo system uses: `primary-base` #0178FF, `text-strong-950` / `bg-strong-950` / `gray-950` #09090B, `bg-white-0` #FFFFFF, `icon-soft-400` / `muted` / `gray-400` #A1A1AA, plus surfaces `bg-weak-50` #FAFAFA, `stroke-soft-200` #E4E4E7, `bg-surface-800` #27272A, `text-sub-600` #52525B.
Also present: `primary-dark` #0169E0, `primary-light` #389CFF, `primary-alpha-10` #0178FF1A, `primary-alpha-16` #0178FF29, `success-base` #00C950, `success-alpha-10` #10B9811A, and the full gray ramp 0 to 950 (including 75, 150, 850, 925). No number, radius or font variables exist in the file.

## Fonts

| Font | Weights | Used on the board for |
|-|-|-|
| Duplet | 400, 500, 600, 700 (uploaded) | page and section titles (semibold) |
| Manrope | variable 200 to 800 | body copy, captions |
| Inter | variable 100 to 900 | not seen on the logo boards |
| bdoGrotesk | variable 300 to 900 | not seen on the logo boards |
| (font-mono, system) | | indices, hex specs, source labels |

The "Nick" and "NickAI" wordmarks are vector lettering, not a font.

## File map

| File | Node id(s) | Notes |
|-|-|-|
| `outline.json` | all pages, plus subtrees of `9nhVkQ3pyUxoW6qE3LNGO`, `JzMroALMMFIPcAk8SQyBw`, `ewX_PJ1_Z5CDmQIGf8XBJ` | raw outline text |
| `tokens.json` | list_variables_and_fonts | parsed + raw |
| `components.json` | list_components | parsed + raw |
| `svg/nick-mark.svg` | `MQE4bUeLAV-_T8l5QBp5e`, path from `QMGka-V4sd4KNDvkYLIc6` | #0178FF |
| `svg/nick-mark-ink.svg` / `-white` / `-muted` | `Qe8HXhEkUJZKshh-l96Qb` / `CS356u-wtG2X_3JWodYzF` / `uphd1DU3jF0pP8M2MuhXM` | |
| `svg/nick-mark-outline-ink.svg` / `-white` | `_yOkO2gshhxwHc42-97eq` / `bT58uULRPfEsCxXTpYyNe` | 64×64, stroke 1.68 |
| `svg/nick-wordmark.svg` / `-white` / `-brand` | `otzCRBA__wK74JzRuN5O_` / `SVXn35XSvcMKScG69LDkU` / `ybooR9eDfwWRQGUlzyfmu` | |
| `svg/nick-full-logo-light.svg` | `_Np5B9ijNHP4c8dp0sD_c` | 91.03×24 |
| `svg/nick-full-logo-dark.svg` | `mRx4R1PVc9rVAr1BuPVk6` | white type, transparent bg |
| `svg/nick-full-logo-mono-ink.svg` / `-mono-white` | `BDvV_pB_VyjlRWPsmNVoH` / `wjB2wYd1rd1vvBHErjCPQ` | |
| `svg/nick-full-logo-reversed-on-brand.svg` | `wtyILn68PENr6ctxIRoTG` | includes #0178FF background |
| `svg/nick-stacked-light.svg` / `-dark` | `NnUwDkaB6wqkl9XR3-WS8` / `vYIS9Ns1z1fUq-hQQl-Rn` | 137.5×149.6 |
| `svg/nick-app-icon.svg` / `-dark` / `-light` | `NkcNfM-prog03OcVpWAEN` / `DaCxp54o8HZ-uo9PJmZLR` / `W5xg9GbEuyxPH9Dn4zk-o` | 128, rx 28.8 (22.5%) |
| `svg/nickai-wordmark.svg` | NickAI vector of `qnwR0zgFb2doqZji-7XX0` | #09090B |
| `svg/nickai-full-logo-dark.svg` | `qnwR0zgFb2doqZji-7XX0` | white type |
| `svg/nickai-full-logo-light.svg` | `ClhT372WmfD7VNX-YzZwP` | ink type |
| `jsx/component-*.jsx` | the two mains + Logo full Dark preview | |
| `jsx/nick-NN-*.jsx` | node id in each file's first line | per-section variant reads |
| `jsx/nickai-00-*.jsx` | NickAI header text nodes | |
| `png/board-nick-logo-system_9nhVkQ3pyUxoW6qE3LNGO.png` | `9nhVkQ3pyUxoW6qE3LNGO` | low-res full board |
| `png/board-nickai-logo-system_JzMroALMMFIPcAk8SQyBw.png` | `JzMroALMMFIPcAk8SQyBw` | low-res full board |
| `png/nick-02-logo-mark-section_*.png`, `nick-full-logo-on-light_*.png`, `nick-app-icon-brand-tile_*.png`, `nick-stacked-on-light_*.png` | id in filename | |
| `png/svg-render-check.png` | none | headless Chrome render of every SVG in `svg/` |

Each SVG is assembled from the exact path strings in the file, placed with the exact percentage geometry from the JSX (nested `<svg preserveAspectRatio="none">`, same as Fountible's export). Nothing was redrawn. Line 1 of each SVG is a provenance comment.

## Gaps and caveats

1. **Logo full variant naming looks inverted.** The default main (`Variant=Light`) paints the NickAI type `#ffffff`; the `Dark` preview paints it `zinc-950`. The "Logo Only Nick" main also has white type. Board instances override this, so the board itself is correct. Worth a check in the file before anyone places a bare component instance.
2. **Not every variant node was read individually.** Nick swatches whose JSX I did not read on their own (Brand on dark mark, Mono white stacked, etc.) differ only in fill. The colours come from their captions and the board screenshot. The 02 section read (`nick-02-logo-mark-section-TRUNCATED.jsx`) was cut off by the tool partway through.
3. **NickAI board instances were not read one by one.** I read the NickAI header notes and the Logo full main + Dark preview, which carry every NickAI vector. NickAI mark, outline, tile and stacked variants use the same mark path, so the Nick SVGs cover them. NickAI stacked lockup geometry (157×126 instance) was not extracted.
4. **Outline stroke width.** The Nick board's instance uses stroke 1.68 in viewBox units; the NickAI board caption says "Stroke 1.5". Unresolved which is canonical.
5. **Screenshots are low resolution** for the full 1440×6400 boards (the tool returns a downscaled image). Section and swatch PNGs are full size.
6. **Section 04 NickAI source label** is truncated in the outline ("public/logos/nickai.s"); I did not read that text node.
7. The main component nodes live on pages (`exEWwRwxEDW2DkJWMTVyN`, `K_7DoJR30CxY9-HNFzvPO`) that `read_canvas_outline` did not list among the page set; I read the mains directly by id.
