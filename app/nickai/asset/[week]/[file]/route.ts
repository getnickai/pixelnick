/**
 * Asset proxy for the /nickai section (STA-473): streams card media from R2
 * so the private bucket never needs public access. Sits under /nickai/* so
 * the password proxy gates it too.
 */
import { getAsset } from "@/lib/nickai-social";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ week: string; file: string }> },
) {
  const { week, file } = await params;
  if (!/^\d{4}-W\d{2}$/.test(week)) return new Response("bad week", { status: 400 });
  const asset = await getAsset(week, file);
  if (!asset) return new Response("not found", { status: 404 });
  return new Response(asset.bytes, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
