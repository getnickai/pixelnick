import { NextResponse } from "next/server";
import { buildUpcoming } from "@/lib/swarm-upcoming";

// Always read the live mirror on each request (no static caching of the route).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const limRaw = new URL(req.url).searchParams.get("limit");
    const limit = limRaw && Number.isFinite(Number(limRaw)) ? Math.min(20, Math.max(1, Number(limRaw))) : 10;

    const feed = await buildUpcoming({ limit });

    return NextResponse.json(feed, {
      headers: {
        // Short edge cache: fixtures change slowly, but the gallery still
        // reflects schedule/elo updates within ~5 min without a redeploy.
        "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("swarm-upcoming route failed:", err);
    return NextResponse.json({ error: "failed to build upcoming feed", games: [] }, { status: 500 });
  }
}
