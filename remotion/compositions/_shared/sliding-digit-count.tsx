import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Frame-deterministic slot-machine number counter for Remotion compositions.
 *
 * Visually matches motion-primitives' `<SlidingNumber>`: each digit slot is a
 * vertical strip of 0-9 clipped to one digit's height; when the digit changes,
 * the strip slides smoothly to the new value via spring physics. The wrap from
 * 9 → 0 takes the short path.
 *
 * The key difference: **no Framer Motion**. Remotion is frame-deterministic and
 * server-renders without `requestAnimationFrame`, so we can't drop in a Framer
 * `useSpring`. Instead, every render we Euler-integrate a per-digit spring
 * across all frames from `countWindow[0]` to the current frame. Each step the
 * spring's target is the discrete digit (0-9) at that frame, derived from a
 * formatted string of the (linearly-interpolated) value — string extraction
 * avoids the floating-point precision bugs that come from `0.95 / 0.01`.
 *
 * Spring constants match motion-primitives: stiffness 280, damping 18, mass
 * 0.3 — a fast spring that settles in ~150ms, giving the characteristic
 * "spinning then clicking" slot-machine feel for fast count-ups.
 *
 * Performance: O(countDuration × digitCount) per render. For a 38-frame count
 * with 6 digits that's ~228 small numeric operations per render — well under
 * 1ms on any modern machine.
 *
 * ### Usage
 *
 *   <SlidingDigitCount
 *     targetValue={pnl}           // 4012.95
 *     countWindow={ANIM.pnlCount} // [30, 68]
 *     decimals={2}
 *     prefix="$"
 *     showSign
 *   />
 *
 * Value is computed internally from `targetValue` + `countWindow` (linear).
 * Before `countWindow[0]` it stays at 0; after `countWindow[1]` it settles
 * at the target.
 */

// Match motion-primitives' spring exactly.
const SPRING_STIFFNESS = 280;
const SPRING_DAMPING = 18;
const SPRING_MASS = 0.3;

// How many extra frames past `countWindow[1]` to keep integrating the spring,
// so it has time to settle to the target. With the constants above, the spring
// settles in ~150ms = ~5 frames at 30fps; 30 is a generous buffer.
const SETTLE_BUFFER_FRAMES = 30;

// Sub-steps per frame for the Euler integration. At 30fps with our spring
// constants, a single per-frame step is numerically unstable — the spring
// overshoots, the high damping force reverses it past zero, oscillation grows,
// and the strip never settles. Sub-stepping (each frame split into N smaller
// time slices) brings `ω_n · dt` well under the stability limit. 8 substeps at
// 30fps gives `dt ≈ 4ms`, comfortably stable.
const SUB_STEPS = 8;

// Default easing for the value count-up: standard "ease-out cubic" — starts
// fast (digits spin rapidly), gracefully decelerates into the target (digits
// settle smoothly). This is the curve most counter animations on the web use.
const DEFAULT_VALUE_EASING = Easing.out(Easing.cubic);

type SlidingDigitCountProps = {
  /** Final value the count reaches (e.g. 4012.95). */
  targetValue: number;
  /** Frame window `[startFrame, endFrame]` over which value counts up. */
  countWindow: readonly [number, number];
  /** Decimal places to display. Default 0. */
  decimals?: number;
  /** Static prefix (e.g. "$"). Sign rendered separately when `showSign` is true. */
  prefix?: string;
  /** Static suffix (e.g. "%"). */
  suffix?: string;
  /** Prepend "+" or "−" based on `targetValue` sign. Default false. */
  showSign?: boolean;
  /** Comma thousand separators in the integer portion. Default true. */
  thousandsSep?: boolean;
  /**
   * Easing applied to the **count-up curve** — the value's path from 0 to
   * `targetValue` across `countWindow`. Defaults to `Easing.out(Easing.cubic)`
   * so the counter starts fast and gracefully decelerates into the target
   * (the standard counter-animation feel). Pass `Easing.linear` to revert to
   * constant-rate counting, or any other Remotion easing function for a
   * different curve.
   *
   * Note: this controls how *fast* the value moves at each moment. When
   * `slide` is true, each digit's slot-machine slide is also smoothed by
   * an internal spring on top of this curve.
   */
  valueEasing?: (t: number) => number;
  /**
   * Controls the visual mode:
   *
   * - `true` (default): slot-machine effect. Each digit's strip slides
   *   smoothly between values via a per-digit spring. Reads as "vertical
   *   reels spinning" — closest to motion-primitives' `<SlidingNumber>`.
   *
   * - `false`: simple counter. Each digit snaps to its current integer
   *   per frame, no sub-frame slide. Reads as "rapidly changing numbers"
   *   — what most counter libraries on the web do. Cheaper (skips the
   *   spring integration entirely), and lands on clean integers every
   *   frame so there's never any visual ambiguity.
   *
   * The `valueEasing` curve still applies in both modes — only the
   * per-digit sub-frame smoothing changes.
   */
  slide?: boolean;
};

type Slot =
  | { type: "digit"; digitIdx: number }
  | { type: "char"; char: string };

export const SlidingDigitCount: React.FC<SlidingDigitCountProps> = ({
  targetValue,
  countWindow,
  decimals = 0,
  prefix = "",
  suffix = "",
  showSign = false,
  thousandsSep = true,
  valueEasing = DEFAULT_VALUE_EASING,
  slide = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sign = showSign ? (targetValue < 0 ? "−" : "+") : "";
  const absTarget = Math.abs(targetValue);

  // Layout width comes from the target so digit slots are stable through the
  // count (commas don't pop in as the integer width grows).
  const targetIntDigits = Math.max(1, Math.floor(absTarget).toString().length);
  const totalDigits = targetIntDigits + decimals;

  const [countStart, countEnd] = countWindow;
  const countDuration = countEnd - countStart;

  /** Eased value at frame f, clamped to `[0, absTarget]`. */
  const valueAt = (f: number): number => {
    const linearProgress = countDuration > 0
      ? Math.max(0, Math.min(1, (f - countStart) / countDuration))
      : 1;
    return valueEasing(linearProgress) * absTarget;
  };

  /** Split a value into per-digit integers via string-based extraction
   *  (avoids FP precision pitfalls like `Math.floor(0.95 / 0.01) = 94`). */
  const digitsAt = (value: number): number[] => {
    const formatted = value.toFixed(decimals);
    const dotIdx = formatted.indexOf(".");
    const intStr = dotIdx >= 0 ? formatted.slice(0, dotIdx) : formatted;
    const decStr = dotIdx >= 0 ? formatted.slice(dotIdx + 1) : "";
    const paddedInt = intStr.padStart(targetIntDigits, "0");
    const out = new Array<number>(totalDigits);
    for (let i = 0; i < targetIntDigits; i++) out[i] = Number(paddedInt[i]);
    for (let i = 0; i < decimals; i++) {
      out[targetIntDigits + i] = Number(decStr[i] ?? "0");
    }
    return out;
  };

  // ===== Compute per-slot place values =====
  // Two modes:
  //   - `slide=true`:  spring-track each digit so the strip slides smoothly
  //                    between values (slot-machine).
  //   - `slide=false`: each slot snaps to its current integer digit per frame
  //                    (counter-style).
  let placeValues: number[];

  if (slide) {
    // Each digit's spring chases the discrete target digit (0-9) as it
    // changes each frame. Position lives in *absolute* units (it can drift
    // outside [0, 10) as the digit cycles), with the wrap-aware target
    // picked each frame so the spring always pulls toward the nearest
    // 10-unit aligned target. Final position is normalised back into
    // [0, 10) only for rendering.
    const positions: number[] = new Array(totalDigits).fill(0);
    const velocities: number[] = new Array(totalDigits).fill(0);
    const subDt = 1 / fps / SUB_STEPS;

    // Start iterating at the count start (before that, springs are at rest at 0).
    // End at the current frame, but cap a bit past countEnd — beyond that the
    // spring has fully settled and extra iterations are wasted.
    const startIter = Math.max(0, countStart);
    const endIter = Math.min(frame, countEnd + SETTLE_BUFFER_FRAMES);

    for (let f = startIter; f <= endIter; f++) {
      const digits = digitsAt(valueAt(f));
      for (let i = 0; i < totalDigits; i++) {
        stepSpringFrame(positions, velocities, i, digits[i], subDt);
      }
    }
    // Normalize each spring position into [0, 10) for rendering.
    placeValues = positions.map((p) => ((p % 10) + 10) % 10);
  } else {
    // Snap mode: no spring, no iteration. Just the current frame's digits.
    placeValues = digitsAt(valueAt(frame));
  }

  // ===== Slot layout =====
  // Build the visual sequence: integer digits (with commas) + optional decimal
  // point + decimal digits. Each "digit" slot points at its index in
  // `placeValues`.
  const slots: Slot[] = [];
  for (let i = 0; i < targetIntDigits; i++) {
    slots.push({ type: "digit", digitIdx: i });
    const positionFromRight = targetIntDigits - 1 - i;
    if (
      thousandsSep &&
      positionFromRight > 0 &&
      positionFromRight % 3 === 0
    ) {
      slots.push({ type: "char", char: "," });
    }
  }
  if (decimals > 0) {
    slots.push({ type: "char", char: "." });
    for (let i = 0; i < decimals; i++) {
      slots.push({ type: "digit", digitIdx: targetIntDigits + i });
    }
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {sign && <span>{sign}</span>}
      {prefix && <span>{prefix}</span>}
      {slots.map((slot, i) =>
        slot.type === "char" ? (
          <span key={i}>{slot.char}</span>
        ) : (
          <SlidingDigit key={i} placeValue={placeValues[slot.digitIdx]} />
        ),
      )}
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

/**
 * Advance one digit's spring across ONE frame using `SUB_STEPS` Euler micro-
 * steps. Mutates `positions[idx]` and `velocities[idx]` in place.
 *
 * The wrap-aware target is selected ONCE at the start of the frame: we find
 * the absolute 10-unit-aligned target nearest to `pos`, so a 9 → 0 transition
 * pulls the spring forward one slot (the short way) rather than backwards
 * through 8,7,…,1,0. We do NOT normalise `pos` between sub-steps — that would
 * discontinuously zero out the spring's "winding number" and lose velocity.
 */
function stepSpringFrame(
  positions: number[],
  velocities: number[],
  idx: number,
  targetDigit: number,
  subDt: number,
) {
  let pos = positions[idx];
  let vel = velocities[idx];

  // Find the absolute target nearest to `pos`. Candidates are
  // targetDigit + 10·k for any integer k; pick k = round((pos - targetDigit)/10).
  const wrapAwareTarget =
    targetDigit + 10 * Math.round((pos - targetDigit) / 10);

  // Sub-stepped Euler. Splitting `1/fps` into N tiny dt's keeps `ω_n · dt`
  // well under the stability limit for the chosen spring constants.
  for (let s = 0; s < SUB_STEPS; s++) {
    // Spring physics: F = -k·(x - x₀) - c·v, then a = F / m.
    const accel =
      (-SPRING_STIFFNESS * (pos - wrapAwareTarget) - SPRING_DAMPING * vel) /
      SPRING_MASS;
    vel += accel * subDt;
    pos += vel * subDt;
  }

  positions[idx] = pos;
  velocities[idx] = vel;
}

const DIGITS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * One digit slot. Renders 0-9 stacked at absolute positions, clipped to a
 * single digit's height. Each digit's `translateY` is computed from its
 * modular distance (shorter path) to the slot's continuous `placeValue`.
 *
 * With a spring-tracked `placeValue`, the strip slides smoothly through
 * digits during count-up and settles cleanly on integers at rest.
 */
const SlidingDigit: React.FC<{ placeValue: number }> = ({ placeValue }) => {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: "1ch",
        overflow: "hidden",
        lineHeight: 1,
        verticalAlign: "baseline",
      }}
    >
      {/* Invisible spacer: gives the wrapper its intrinsic height (one digit
         tall) AND establishes the inline-block's baseline at the natural digit
         position so the slot aligns with surrounding text (commas, $, etc.). */}
      <span aria-hidden style={{ visibility: "hidden" }}>0</span>
      {DIGITS.map((n) => {
        const raw = (10 + n - placeValue) % 10;
        // Shorter visual path: digits more than half a wheel away render on
        // the negative side, so transitions take the short way around.
        const offset = raw > 5 ? raw - 10 : raw;
        return (
          <span
            key={n}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // 100% of the slot height = one digit's worth of vertical travel.
              transform: `translateY(${offset * 100}%)`,
            }}
          >
            {n}
          </span>
        );
      })}
    </span>
  );
};
