import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-origin image proxy for builder avatars.
 *
 * Builder avatars are user-uploaded images on S3 that don't send CORS headers.
 * They display fine in an <img>, but the in-browser PNG export (html-to-image)
 * must read their pixels — a cross-origin fetch that S3 rejects, aborting the
 * whole export. Serving them through this same-origin route makes the export
 * work. The generation pipeline solves the same problem by downloading avatars
 * locally before render (`scripts/generate-cards.ts`); this is the live-page
 * equivalent.
 *
 * Host-allowlisted so it can't be used as an open proxy (SSRF guard). The deck
 * builder only ever points us at allowlisted hosts; anything else is rejected.
 */
const ALLOWED_HOSTS = [
  "nickai-user-uploads.s3.us-east-1.amazonaws.com",
];

function isAllowed(u: URL): boolean {
  return (
    (u.protocol === "https:" || u.protocol === "http:") &&
    ALLOWED_HOSTS.includes(u.hostname)
  );
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!isAllowed(target)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(upstream.body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
