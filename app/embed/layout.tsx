import type { ReactNode } from "react";
import { PinRootFontSize } from "@/components/pin-root-font-size";

/**
 * The /embed routes render the fixed-px performance card. Pin the root to 16px
 * so it renders pixel-accurately regardless of the viewer's browser font-size.
 */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PinRootFontSize />
      {children}
    </>
  );
}
