import { toJpeg, toPng } from "html-to-image";

export type StaticImageFormat = "png" | "jpeg";

const CAPTURE_OPTIONS = {
  pixelRatio: 2,
  cacheBust: true,
} as const;

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
  };

  const dataUrl =
    options.format === "png"
      ? await toPng(root, capture)
      : await toJpeg(root, { ...capture, quality: 0.92 });

  const ext = options.format === "png" ? "png" : "jpg";
  downloadDataUrl(dataUrl, `${options.id}.${ext}`);
}
