"use client";

import { useState } from "react";
import { domToPng } from "modern-screenshot";

// IG portrait: 1080 × 1350 (4:5). Slides render at 376 × 470 in the UI, so we
// upscale each capture by pixelRatio = 1080 / nodeWidth.
const EXPORT_WIDTH = 1080;

export function DownloadSlidesButton() {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-export-slide]"));
      // ensure web fonts are loaded so headlines rasterize, not fall back
      if (document.fonts?.ready) await document.fonts.ready;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const w = node.offsetWidth || EXPORT_WIDTH;
        const dataUrl = await domToPng(node, {
          scale: EXPORT_WIDTH / w,
          style: { borderRadius: "0" }, // square corners for the posted image
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `agentic-drop-${String(i + 1).padStart(2, "0")}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 250)); // let the browser register each download
      }
    } catch (err) {
      console.error("[agentic-drop] PNG export failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="shrink-0 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:opacity-90 disabled:opacity-60"
    >
      {busy ? "Exporting…" : "Download PNGs"}
    </button>
  );
}
