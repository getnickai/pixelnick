"use client";

import { useCallback, useRef, useState } from "react";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportStaticVisual,
  type StaticImageFormat,
} from "@/lib/export-static-image";
import type { StaticEntryMeta } from "@/static/manifest";

type StaticVisualHostProps = {
  entry: StaticEntryMeta;
  children: React.ReactNode;
};

/**
 * Wraps a static visual preview and exposes PNG/JPEG export of the card `<article>`.
 */
export function StaticVisualHost({ entry, children }: StaticVisualHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<StaticImageFormat | null>(null);

  const handleExport = useCallback(
    async (format: StaticImageFormat) => {
      const article = hostRef.current?.querySelector("article");
      if (!article || !(article instanceof HTMLElement)) {
        return;
      }

      setExporting(format);
      try {
        await exportStaticVisual(article, {
          id: entry.id,
          width: entry.width,
          height: entry.height,
          format,
        });
      } finally {
        setExporting(null);
      }
    },
    [entry.height, entry.id, entry.width],
  );

  return (
    <div className="relative shrink-0">
      <div ref={hostRef}>{children}</div>

      <div
        className="absolute left-full top-1/2 ml-4 flex -translate-y-1/2 flex-col gap-2"
        role="group"
        aria-label="Export static visual"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => handleExport("png")}
          className="min-w-[5.5rem] justify-start gap-2"
        >
          <ImageIcon className="size-3.5" />
          {exporting === "png" ? "Exporting…" : "PNG"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => handleExport("jpeg")}
          className="min-w-[5.5rem] justify-start gap-2"
        >
          <Download className="size-3.5" />
          {exporting === "jpeg" ? "Exporting…" : "JPG"}
        </Button>
        <p className="max-w-[5.5rem] text-center font-mono text-[10px] leading-tight text-muted-foreground">
          {entry.width}×{entry.height} @2×
        </p>
      </div>
    </div>
  );
}
