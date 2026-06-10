/* eslint-disable @next/next/no-img-element */
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { useEffect, useState } from "react";
import type { SwarmIntroProps } from "./props";

const ASSET = "/swarm-intro";
const MODELS_ASSET = `${ASSET}/models`;

/** Frame is 650×600 (Figma node 373:1485). */
const FRAME_W = 650;
const FRAME_H = 600;

/**
 * SwarmArena hex mark (Figma node 373:1568). One path, three subpaths: the
 * top hexagon, the connected middle cluster (4 corner hexes + center + arms),
 * and the bottom hexagon. Inlined (not an <img>) so the fill can crossfade
 * white → brand orange.
 */
const MARK_W = 73.3076;
const MARK_H = 83.7514;
const MARK_PATH =
  "M39.6352 23.9035L45.946 20.1408C47.4582 19.2384 47.9835 17.5205 47.97 15.8442L47.9076 8.11432C47.8965 6.73438 46.9684 5.28954 45.815 4.61242L39.1626 0.711348C37.5978 -0.205759 35.804 -0.253512 34.2159 0.669717L28.1071 4.2206C26.4786 5.16709 25.3582 6.68785 25.3644 8.61022L25.3889 16.5924C25.3925 17.9368 26.088 19.362 27.2831 20.0759L33.7138 23.917C35.6338 25.0643 37.6602 25.0777 39.634 23.901L39.6352 23.9035ZM50.6528 53.2485L50.7079 60.671C50.7177 62.0681 51.5344 63.6575 52.76 64.3689L60.0393 68.5956C61.3323 69.3462 63.0221 69.1503 64.2551 68.4328L71.0067 64.5011C72.2605 63.7701 73.2266 62.2677 73.24 60.769L73.3074 53.1946C73.3257 51.162 72.2972 49.5164 70.5891 48.4989L67.206 46.4834C65.4305 45.4255 64.6408 43.2583 64.8685 41.1963C65.0828 39.2604 66.3954 37.6858 68.1598 36.6891L70.5903 35.3165C72.0891 34.4704 73.2621 32.9607 73.2621 31.14L73.2645 23.1994C73.2645 21.2489 71.9776 19.8457 70.4091 18.931L64.0702 15.2393C62.8531 14.5304 61.2332 14.4459 59.9708 15.1916L52.6976 19.4882C49.9316 21.1216 50.8719 24.9859 50.6283 27.8144C50.343 31.1363 46.737 33.6513 43.5535 32.564C40.4348 31.4975 38.0006 27.9576 34.0199 30.2363L30.2952 32.3681C28.723 33.268 26.8362 32.8566 25.2358 31.9028C20.1274 28.86 24.8868 21.9946 20.5707 19.4318L13.7346 15.374C12.2763 14.5084 10.5376 14.468 9.08053 15.3263L2.45017 19.2335C1.0286 20.071 0.0416981 21.6126 0.0343515 23.3023L6.71269e-05 30.6453C-0.0097284 32.7207 1.05309 34.3566 2.82975 35.3594L5.55536 36.8973C7.25978 37.8597 8.33239 39.5715 8.4781 41.413C8.63115 43.3452 7.94914 45.3973 6.25941 46.4063L2.5567 48.6176C1.1939 49.4319 0.0576159 50.8792 0.0478203 52.5726L0.00863822 60.1568C-0.00115731 62.1759 1.07023 63.7946 2.77588 64.7852L8.65809 68.1989C10.2486 69.1221 12.0486 69.3927 13.7003 68.4242L20.3295 64.5415C21.8563 63.6477 22.6473 61.9028 22.6412 60.1702L22.6131 52.706C22.5984 48.7548 18.4989 48.1511 16.077 46.083C14.1179 44.4092 13.6954 41.5342 14.8758 39.258C16.0109 37.0699 18.4659 35.8381 21.0384 36.4712C23.2657 37.0197 25.1207 38.9605 25.3313 41.4938C25.6166 44.9284 24.4411 48.0177 27.9394 50.0196L34.4803 53.7603C35.777 54.5011 37.4521 54.5647 38.7634 53.8154L45.0669 50.2119C46.6317 49.318 47.9027 47.8413 47.9235 45.9728L47.9749 41.5C48.1671 38.9654 50.0773 36.9916 52.3511 36.4553C54.915 35.8504 57.3358 37.0809 58.4782 39.3119C59.5973 41.4975 59.2398 44.2905 57.3578 45.9875C54.7926 48.3017 50.616 48.5356 50.6515 53.2472L50.6528 53.2485ZM38.914 83.1665L44.855 79.7686C46.4799 78.8393 47.9174 77.4667 47.9174 75.4819V67.25C47.9149 65.6521 46.9096 64.1815 45.5579 63.382L39.705 59.9192C37.8855 58.8429 35.9668 58.5797 34.0861 59.6915L27.4839 63.5938C26.1125 64.4044 25.3791 65.9508 25.3827 67.4997L25.4036 75.6019C25.4085 77.474 26.8827 78.832 28.3863 79.694L34.3126 83.0881C35.7146 83.8913 37.4202 84.0211 38.914 83.1665Z";

/** Final lockup geometry (Figma frame "A": logo + 41.876 gap + text). */
const LOCKUP_W = 398.183;
const TEXT_LEFT = (FRAME_W - LOCKUP_W) / 2 + MARK_W + 41.876;
/** How far the mark slides left from frame-center to its lockup slot. */
const DOCK_X = (FRAME_W - LOCKUP_W) / 2 + MARK_W / 2 - FRAME_W / 2;

/**
 * Circular orbit of AI-model logos (Figma frames 376:1644 / 376:1656). The
 * Figma orbit repeats an OpenAI placeholder; the real lineup below replaces
 * it. Marks are lobehub mono SVGs normalized to the design's white, laid out
 * evenly from 12 o'clock clockwise; positions are computed with sin/cos so
 * the marks stay upright while the ring rotates.
 */
const ORBIT_LOGOS = [
  "openai",
  "claude",
  "kimi",
  "minimax",
  "deepseek",
  "grok",
  "gemini",
] as const;
const ORBIT_RADIUS = 230;
const ORBIT_LOGO_SIZE = 82.5;

/**
 * Master timeline (30fps). Each window is [startFrame, endFrame]. Moves run
 * on ease-in-out curves: the short opening zoom uses easeInOutCubic (visible
 * accel/decel even in a 16-frame window); everything after runs on
 * easeInOutExpo (https://easings.net/#easeInOutExpo) — imperceptible start,
 * hard acceleration through the middle, long glide into place. Story:
 * backdrop alone → the whole mark fades in huge and dimmed to "gray" (the
 * near-still first third of the zoom curve IS the "loom" beat) → it whooshes
 * down to lockup size, brightening to white through the fast mid-section →
 * then the mark glides left into its lockup slot, igniting white → orange,
 * with the wordmark riding the same curve just behind it — wide tracking and
 * right-offset tightening as it travels, letters fading on left to right.
 *
 * Act 2 (Figma 376:1644): the lockup slides further left and fades out while
 * the centered "AI Agents / Compete" statement letters in. Act 3 (Figma
 * 376:1656): the statement swaps to "For Predicting / World Cup 2026" while
 * the seven model logos pop in clockwise from 12 o'clock and the whole ring
 * eases into a steady orbit.
 * Runs 252 frames = 8.4s (~6.5s motion + rotating hold).
 */
const ANIM = {
  // Phase 1 — fade-zoom: one continuous inOutExpo zoom, huge → lockup size.
  fadeIn: [2, 9], // opacity 0 → dim while the zoom is still near-still
  zoom: [4, 20], // scale: blink of loom → whoosh (mid ≈ frame 12) → glide to 1
  scaleBig: 3.35,
  dim: 0.45,
  // dim → full white through the whoosh. Must start strictly after fadeIn
  // ends: both feed one interpolate as [fadeIn[0], fadeIn[1], brighten[0],
  // brighten[1]], which Remotion requires to be strictly increasing.
  brighten: [10, 18],

  // Phase 2 — the lockup assembles in one leftward glide: the mark docks
  // left (igniting white → orange) and the wordmark container rides the SAME
  // dock curve — starting wide-tracked and offset right, tightening as it
  // travels — while letters fade on left to right just behind the mark's
  // trailing edge, close but never under it.
  dock: [22, 48],
  ignite: [24, 42],
  letterStart: 28,
  letterStagger: 2,
  letterRamp: 10,
  trackEm: 0.22, // starting letter-spacing (em); tightens with the dock
  blockShift: 130, // px the wordmark starts right of its slot; rides the dock

  // Act 2 — the settled lockup exits left; "AI Agents / Compete" letters in.
  lockupExit: [74, 92],
  exitSlide: 90, // extra px the lockup travels left while fading out
  aiLine1Start: 94,
  aiLine2Start: 102,
  aiTrack: [94, 124],

  // Act 3 — statement swaps to "For Predicting / World Cup 2026"; the seven
  // model logos pop in clockwise from 12 o'clock; the ring eases into a
  // steady orbit.
  aiTextOut: [140, 152],
  wcLine1Start: 152,
  wcLine2Start: 160,
  wcTrack: [152, 188],
  orbitLogoStart: 144,
  orbitLogoStagger: 4,
  orbitLogoRamp: 12,
  rotStart: 140,
  rotAccel: 30, // frames to ramp from standstill to full orbit speed
  rotSpeed: 0.75, // deg/frame once at speed (≈22.5°/s)
} as const;

/**
 * Centered two-line statement (Figma 376:1649 / 376:1661): letters fade on
 * left to right per line while the tracking tightens from wide to normal.
 * The optional `out` window fades the block while tracking back out.
 */
const CenteredLetterText: React.FC<{
  lines: readonly [string, string];
  lineStarts: readonly [number, number];
  track: readonly [number, number];
  out?: readonly [number, number];
}> = ({ lines, lineStarts, track, out }) => {
  const frame = useCurrentFrame();
  const trackT = interpolate(frame, track, [0, 1], {
    easing: Easing.inOut(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outT = out
    ? interpolate(frame, out, [0, 1], {
        easing: Easing.inOut(Easing.exp),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  // Frame-based mount guards: easing(0)/easing(1) are not exactly 0/1 for
  // Easing.exp, so opacity thresholds would never trigger.
  if (frame < lineStarts[0] || (out && frame >= out[1])) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{ opacity: 1 - outT }}
    >
      {lines.map((line, li) => (
        <p
          key={li}
          className="m-0 whitespace-pre"
          style={{
            fontFamily:
              'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif',
            fontSize: 46.063,
            fontWeight: 600,
            lineHeight: "normal",
            color: "#fff8ea",
            letterSpacing: `${(1 - trackT) * ANIM.trackEm + outT * 0.1}em`,
          }}
        >
          {line.split("").map((ch, i) => {
            const start = lineStarts[li] + i * ANIM.letterStagger;
            const letterOpacity = interpolate(
              frame,
              [start, start + ANIM.letterRamp],
              [0, 1],
              {
                easing: Easing.inOut(Easing.exp),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return (
              <span
                key={i}
                className="inline-block"
                style={{ opacity: letterOpacity }}
              >
                {ch}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
};

/**
 * Animated SwarmArena intro sting (Figma node 373:1485, 650×600).
 *
 * The backdrop — gradient, the two blend-overlay hex watermarks, and the
 * bottom progressive-blur strip — is present from frame 0; only the lockup
 * animates. Every value is driven by `useCurrentFrame()`, so the composition
 * plays in `<Player>` and renders headless identically. Timing lives in the
 * `ANIM` block above.
 */
export const SwarmIntroComposition: React.FC<SwarmIntroProps> = ({
  wordmark = "Swarm Arena",
}) => {
  const frame = useCurrentFrame();

  // Block the first captured frame until Duplet is ready. In the app the font
  // arrives via next/font; headless it comes from the @font-face in
  // remotion/style.css — either way letters must not flash a fallback face.
  const [fontHandle] = useState(() => delayRender("Loading Duplet"));
  useEffect(() => {
    document.fonts.ready
      .then(() => continueRender(fontHandle))
      .catch(() => continueRender(fontHandle));
  }, [fontHandle]);

  // --- Mark: scale (huge → lockup size) ---
  // One continuous ease-in-out zoom. Cubic, not expo: in a window this short
  // expo spends half the frames near-still (hidden behind the fade) and then
  // jumps — cubic keeps the accelerate→decelerate arc visible.
  const markScale = interpolate(frame, ANIM.zoom, [ANIM.scaleBig, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Mark: fade in to the dim "gray" state, hold, then full brightness ---
  const markOpacity = interpolate(
    frame,
    [...ANIM.fadeIn, ...ANIM.brighten],
    [0, ANIM.dim, ANIM.dim, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // --- Mark: ignite to brand orange as it docks ---
  const igniteT = interpolate(frame, ANIM.ignite, [0, 1], {
    easing: Easing.inOut(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markFill = interpolateColors(igniteT, [0, 1], ["#FFFFFF", "#F47544"]);

  // --- Mark: dock from frame-center into the lockup slot ---
  const dockT = interpolate(frame, ANIM.dock, [0, 1], {
    easing: Easing.inOut(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dockX = DOCK_X * dockT;

  // --- Act 2: the settled lockup slides further left and fades out ---
  const exitT = interpolate(frame, ANIM.lockupExit, [0, 1], {
    easing: Easing.inOut(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitX = -ANIM.exitSlide * exitT;

  // --- Orbit rotation ---
  // Quadratic velocity ramp from standstill to `rotSpeed`, then linear — the
  // ring eases into a steady orbit with no jerk at the hand-off.
  const rotElapsed = Math.max(0, frame - ANIM.rotStart);
  const orbitDeg =
    rotElapsed <= ANIM.rotAccel
      ? 0.5 * (ANIM.rotSpeed / ANIM.rotAccel) * rotElapsed * rotElapsed
      : 0.5 * ANIM.rotSpeed * ANIM.rotAccel +
        (rotElapsed - ANIM.rotAccel) * ANIM.rotSpeed;

  // --- Wordmark letters ---
  const letters = wordmark.split("");

  return (
    <AbsoluteFill
      className="overflow-clip"
      style={{ background: "linear-gradient(to bottom, #0b0a0f, #1d120e)" }}
    >
      {/* Hex watermarks — blend-overlay, mirrored, bleeding past the frame */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: 318,
          top: -284.61,
          width: 412.465,
          height: 471.227,
          mixBlendMode: "overlay",
          transform: "rotate(180deg) scaleY(-1)",
        }}
        aria-hidden
      >
        <img
          alt=""
          src={`${ASSET}/watermark-top.svg`}
          className="block size-full max-w-none"
        />
      </div>
      <div
        className="pointer-events-none absolute"
        style={{
          left: -127.46,
          top: 376.37,
          width: 412.465,
          height: 471.227,
          mixBlendMode: "overlay",
          transform: "rotate(180deg) scaleY(-1)",
        }}
        aria-hidden
      >
        <img
          alt=""
          src={`${ASSET}/watermark-bottom.svg`}
          className="block size-full max-w-none"
        />
      </div>

      {/* Bottom progressive-blur strip (softens the lower watermark) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: 169.352,
          backdropFilter: "blur(17px)",
          WebkitBackdropFilter: "blur(17px)",
          background: "rgba(0,0,0,0.01)",
        }}
        aria-hidden
      />

      {/* Mark — starts frame-centered, condenses, docks left, then exits */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: MARK_W,
          height: MARK_H,
          opacity: markOpacity * (1 - exitT),
          transform: `translate(-50%, -50%) translateX(${dockX + exitX}px) scale(${markScale})`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${MARK_W} ${MARK_H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={MARK_PATH} fill={markFill} />
        </svg>
      </div>

      {/* Wordmark — rides the dock curve (offset right, wide-tracked, both
          tightening with the glide) so logo and text travel left together;
          letters fade on left to right just behind the mark's trailing edge */}
      <div
        className="absolute inset-y-0 flex items-center"
        style={{
          left: TEXT_LEFT,
          opacity: 1 - exitT,
          transform: `translateX(${exitX}px)`,
        }}
      >
        <p
          className="m-0 whitespace-pre"
          style={{
            fontFamily:
              'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif',
            fontSize: 46.063,
            fontWeight: 600,
            lineHeight: "normal",
            color: "#fff8ea",
            letterSpacing: `${(1 - dockT) * ANIM.trackEm}em`,
            transform: `translateX(${(1 - dockT) * ANIM.blockShift}px)`,
          }}
        >
          {letters.map((ch, i) => {
            const start = ANIM.letterStart + i * ANIM.letterStagger;
            const letterOpacity = interpolate(
              frame,
              [start, start + ANIM.letterRamp],
              [0, 1],
              {
                easing: Easing.inOut(Easing.exp),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return (
              <span
                key={i}
                className="inline-block"
                style={{ opacity: letterOpacity }}
              >
                {ch}
              </span>
            );
          })}
        </p>
      </div>

      {/* Orbit — AI-model logos pop in on the ring, then orbit steadily.
          Position is computed per frame (clockwise from 12 o'clock), so the
          marks stay upright while the ring turns. */}
      <div className="pointer-events-none absolute inset-0">
        {ORBIT_LOGOS.map((name, i) => {
          const popStart = ANIM.orbitLogoStart + i * ANIM.orbitLogoStagger;
          const popEnd = popStart + ANIM.orbitLogoRamp;
          if (frame < popStart) return null;
          const logoOpacity = interpolate(frame, [popStart, popEnd], [0, 1], {
            easing: Easing.inOut(Easing.exp),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const logoScale = interpolate(frame, [popStart, popEnd], [0.6, 1], {
            easing: Easing.inOut(Easing.exp),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const theta =
            (((i * 360) / ORBIT_LOGOS.length + orbitDeg) * Math.PI) / 180;
          return (
            <div
              key={name}
              className="absolute"
              style={{
                left: FRAME_W / 2 + ORBIT_RADIUS * Math.sin(theta),
                top: FRAME_H / 2 - ORBIT_RADIUS * Math.cos(theta),
                width: ORBIT_LOGO_SIZE,
                height: ORBIT_LOGO_SIZE,
                opacity: logoOpacity,
                transform: `translate(-50%, -50%) scale(${logoScale})`,
              }}
            >
              <img
                alt=""
                src={`${MODELS_ASSET}/${name}.svg`}
                className="block size-full max-w-none"
              />
            </div>
          );
        })}
      </div>

      {/* Act 2 statement — "AI Agents / Compete" (Figma 376:1644) */}
      <CenteredLetterText
        lines={["AI Agents", "Compete"]}
        lineStarts={[ANIM.aiLine1Start, ANIM.aiLine2Start]}
        track={ANIM.aiTrack}
        out={ANIM.aiTextOut}
      />

      {/* Act 3 statement — "For Predicting / World Cup 2026" (376:1656) */}
      <CenteredLetterText
        lines={["For Predicting", "World Cup 2026"]}
        lineStarts={[ANIM.wcLine1Start, ANIM.wcLine2Start]}
        track={ANIM.wcTrack}
      />
    </AbsoluteFill>
  );
};
