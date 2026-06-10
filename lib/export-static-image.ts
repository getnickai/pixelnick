import { toJpeg, toPng } from "html-to-image";

export type StaticImageFormat = "png" | "jpeg";

// Match the Swarm Arena history download path exactly (it rasterises a card of
// comparable complexity reliably):
//   - skipFonts: fonts are already in the DOM (we await document.fonts.ready),
//     so don't let html-to-image re-fetch + inline @font-face sources — those
//     cross-origin fetches reject ("Failed to fetch") and abort the export.
//   - cacheBust: false — with `true`, html-to-image appends a unique query
//     param to EVERY resource URL and re-fetches it mid-clone; on this card
//     (10 SVGs + the proxied avatar) that re-fetch storm stalls toPng. The
//     resources are already loaded, so reuse them.
const CAPTURE_OPTIONS = {
  pixelRatio: 2,
  cacheBust: false,
  skipFonts: true,
} as const;

/** Bound the rasterise so a stall can never freeze the tab (Swarm does this). */
const EXPORT_TIMEOUT_MS = 15000;
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("export timed out")), ms)),
  ]);
}

async function waitForExportReady(root: HTMLElement): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Rasterise a static visual `<article>` (or root) to PNG/JPEG and trigger a download.
 */
export async function exportStaticVisual(
  root: HTMLElement,
  options: {
    id: string;
    width: number;
    height: number;
    format: StaticImageFormat;
  },
): Promise<void> {
  await waitForExportReady(root);

  const capture = {
    ...CAPTURE_OPTIONS,
    width: options.width,
    height: options.height,
    // Neutralise any scale transform on the captured node (gallery thumbnails
    // render the card scaled down) so the export is full-resolution.
    style: { transform: "none", transformOrigin: "top left", margin: "0" },
  };

  const dataUrl = await withTimeout(
    options.format === "png"
      ? toPng(root, capture)
      : toJpeg(root, { ...capture, quality: 0.92 }),
    EXPORT_TIMEOUT_MS,
  );

  const ext = options.format === "png" ? "png" : "jpg";
  downloadDataUrl(dataUrl, `${options.id}.${ext}`);
}
