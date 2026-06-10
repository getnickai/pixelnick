import { NextResponse } from "next/server";
import { buildSwarmDeck } from "@/lib/swarm-deck";

// Always read live R2 on each request (no static caching of the route itself).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Ignore a malformed ?at= (would otherwise NaN-filter to an empty deck).
    const atRaw = new URL(req.url).searchParams.get("at");
    const at = atRaw && !Number.isNaN(Date.parse(atRaw)) ? atRaw : undefined;

    // Drop the internal bucket path from the public payload.
    const { _generatedFrom, ...deck } = await buildSwarmDeck({ at });
    void _generatedFrom;

    return NextResponse.json(deck, {
      headers: {
        // Short edge cache so a burst of viewers doesn't hammer R2, but the
        // gallery still reflects new runs within ~30s. Tune as needed.
        "cache-control": "public, max-age=30, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("swarm-deck route failed:", err);
    return NextResponse.json({ error: "failed to build deck" }, { status: 500 });
  }
}
