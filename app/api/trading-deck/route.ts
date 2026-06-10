import { NextResponse } from "next/server";
import { buildTradingDeck } from "@/lib/trading-deck";

// Always read live R2 on each request (no static caching of the route itself).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Drop the internal bucket path from the public payload.
    const { _generatedFrom, ...deck } = await buildTradingDeck();
    void _generatedFrom;

    return NextResponse.json(deck, {
      headers: {
        // Short edge cache so a burst of viewers doesn't hammer R2, but the
        // gallery still reflects new runs within ~30s. Mirrors /api/swarm-deck.
        "cache-control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("trading-deck route failed:", err);
    return NextResponse.json({ error: "failed to build deck" }, { status: 500 });
  }
}
