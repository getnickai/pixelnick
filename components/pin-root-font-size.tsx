/**
 * Pin the document root font-size to 16px.
 *
 * The performance card is a FIXED 650×1136 design whose text + spacing use
 * rem-based Tailwind utilities, which assume a 16px root. Browsers/OSes set to a
 * larger default (e.g. 24px "large text") scale every rem 1.5×, overflowing the
 * fixed card (clipped runs/trades, "Built By" colliding with the meta row,
 * broken CTA). These are pixel-accurate share graphics that must render the same
 * for everyone, so pin the root to 16px on every route that renders the card.
 *
 * Rendered as a plain <style> from a Server Component — scoped to the segment it
 * lives in (it unmounts when you navigate away).
 */
export function PinRootFontSize() {
  return <style>{"html{font-size:16px}"}</style>;
}
