"use client";

import { useState } from "react";
import { domToPng } from "modern-screenshot";

// IG portrait: 1080 × 1350 (4:5). Slides render at 376 × 470 in the UI, so we
// upscale each capture by pixelRatio = 1080 / nodeWidth.
const EXPORT_WIDTH = 1080;

/**
 * One-click export of a slideshow's slides to 1080×1350 PNGs.
 * - `targetId`: limit the export to slides inside `#<targetId>` (one day's
 *   strip). Omit to export every [data-export-slide] on the page.
 * - `prefix`: filename prefix (default "agentic-drop"); pass the edition date
 *   so each day's files are distinguishable.
 */
export function DownloadSlidesButton({
  targetId,
  prefix = "agentic-drop",
  label = "Download PNGs",
  size = "md",
}: {
  targetId?: string;
  prefix?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const root = targetId ? document.getElementById(targetId) : document;
      const nodes = root
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-export-slide]"))
        : [];
      if (nodes.length === 0) {
        setError("No slides found to export");
        return;
      }
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
        a.download = `${prefix}-${String(i + 1).padStart(2, "0")}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 250)); // let the browser register each download
      }
    } catch (err) {
      console.error("[agentic-drop] PNG export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  const sizing = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className={`shrink-0 rounded-lg bg-primary-500 font-semibold text-zinc-950 transition hover:opacity-90 disabled:opacity-60 ${sizing}`}
      >
        {busy ? "Exporting…" : label}
      </button>
      {error ? (
        <p role="alert" className="max-w-[16rem] text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
