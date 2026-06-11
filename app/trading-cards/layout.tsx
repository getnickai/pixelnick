/**
 * Force the Trading Cards routes to be dynamic (no static prerender).
 *
 * These pages render live agent data from R2 and must always reflect the
 * current deployment. As statically-prerendered pages they were served from
 * Vercel's edge cache and not reliably invalidated on deploy — the cached shell
 * kept referencing an older build's JS chunks, so design changes didn't show up
 * live even though the deployment was current. Marking the segment dynamic means
 * each request is served fresh from the active deployment.
 */
export const dynamic = "force-dynamic";

export default function TradingCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
