/**
 * Browser entry for baking the nicksitev2 hero silk shader to a frame sequence.
 * Bundled to IIFE via esbuild; exposes window.__waveBake.
 */
import {
  createGradient,
  type GradientHandle,
} from "../../../nicksitev2/src/components/marketing/hero-shader/gradient-engine";

// Must match gradient-engine.ts — setTime(ms) sets u_time = TIME_BASE + ms,
// while the live loop uses TIME_BASE + PHASE_MS + elapsed. Pass PHASE_MS + t.
export const PHASE_MS = 348_000;

declare global {
  interface Window {
    __waveBake: {
      ready: Promise<void>;
      setTheme(mode: "light" | "dark"): void;
      setTime(elapsedMs: number): void;
      canvas: HTMLCanvasElement;
    };
  }
}

const canvas = document.getElementById("wave") as HTMLCanvasElement;
const handle: GradientHandle = createGradient(canvas, [0.035, 0.035, 0.043]);
handle.setPlaying(false);
handle.setTheme("dark");
handle.setTime(PHASE_MS);

/** Wait until the palette has painted something non-black. */
function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      handle.setTime(PHASE_MS);
      const probe = document.createElement("canvas");
      probe.width = 32;
      probe.height = 32;
      const pctx = probe.getContext("2d")!;
      pctx.drawImage(canvas, 0, 0, 32, 32);
      const data = pctx.getImageData(0, 0, 32, 32).data;
      let max = 0;
      for (let i = 0; i < data.length; i += 4) {
        max = Math.max(max, data[i], data[i + 1], data[i + 2]);
      }
      if (max > 20 || performance.now() - start > 8000) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

window.__waveBake = {
  ready: waitForPaint(),
  setTheme(mode) {
    handle.setTheme(mode);
    handle.setTime(PHASE_MS);
  },
  setTime(elapsedMs) {
    handle.setTime(PHASE_MS + elapsedMs);
  },
  canvas,
};
