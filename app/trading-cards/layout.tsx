/**
 * Trading Cards route layout.
 *
 * 1. `force-dynamic`: these pages render live R2 data and must reflect the
 *    current deployment, not a statically-cached shell (Vercel was serving a
 *    stale prerender that referenced old chunks).
 *
 * 2. Root font-size pin (16px): the cards are a FIXED 650×1136 design whose
 *    text + spacing use rem-based Tailwind utilities, which assume a 16px root
 *    font-size. Browsers/OSes set to a larger default (e.g. 24px "Large" text)
 *    scale every rem 1.5×, overflowing the fixed card — clipped runs/trades,
 *    "Built By" colliding with the meta row, broken CTA. These are
 *    pixel-accurate share graphics, so they must render the same for everyone;
 *    pinning `html` to 16px on these card-kit pages guarantees that. (The style
 *    is scoped to this segment — it unmounts when you navigate away.)
 */
export const dynamic = "force-dynamic";

export default function TradingCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{"html{font-size:16px}"}</style>
      {children}
    </>
  );
}
