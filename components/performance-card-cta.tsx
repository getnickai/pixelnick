/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib/utils";

const ASSET = "/figma";

const CTA_GRADIENT = "linear-gradient(180deg, #8FC3FF 0%, #0178FF 100%)";

type PerformanceCardCtaProps = {
  className?: string;
  style?: React.CSSProperties;
  /** Remotion Player: overlap tab onto body to hide anti-aliased seam. */
  variant?: "static" | "motion";
};

/**
 * "Try in NickAI" CTA — chamfered tab + vertical blue gradient + color-dodge overlay.
 * Matches the Figma export (`cta-tab.svg`, `cta-overlay.svg`, `arrow-right.svg`).
 */
export function PerformanceCardCta({
  className,
  style,
  variant = "static",
}: PerformanceCardCtaProps) {
  return (
    <div className={cn("relative flex items-start", className)} style={style}>
      <div
        className="relative h-[56px] w-[46px] shrink-0 rotate-180"
        style={variant === "motion" ? { marginRight: -4 } : undefined}
      >
        <img
          alt=""
          src={`${ASSET}/cta-tab.svg`}
          className="absolute inset-0 block size-full max-w-none"
        />
      </div>

      <div
        className="relative flex shrink-0 items-center gap-[9px] rounded-none rounded-r-full py-4 pr-5"
        style={{ backgroundImage: CTA_GRADIENT }}
      >
        <p
          className="whitespace-nowrap font-sans text-xl font-semibold leading-[1.2] text-zinc-950"
          style={{ textShadow: "0 1px 0 rgba(255, 255, 255, 0.5)" }}
        >
          Try in NickAI
        </p>
        <div className="relative size-6 shrink-0">
          <img
            alt=""
            src={`${ASSET}/arrow-right.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-0 top-0 h-[56px] w-[211px] rotate-180"
        style={{ mixBlendMode: "color-dodge" }}
      >
        <img
          alt=""
          src={`${ASSET}/cta-overlay.svg`}
          className="absolute inset-0 block size-full max-w-none"
        />
      </div>
    </div>
  );
}
