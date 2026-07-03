/**
 * Password gate for the /nickai social calendar section (STA-473 CP6).
 *
 * POSITIVE matcher: only /nickai/* is ever touched. Everything else on
 * pixelnick (the /api/x-capi conversion relay, embed/static/motion card
 * routes the crons screenshot, Slack unfurls) is untouched by construction —
 * never convert this to a deny-all-except-exemptions matcher.
 *
 * Auth: the unlock page sets a cookie holding sha256(NICKAI_SOCIAL_PASSWORD);
 * the proxy recomputes and compares. Fail-safe default: if the password env
 * is missing, the section is closed (503), not open.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE = "nickai_social_auth";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/nickai/unlock") return NextResponse.next();

  const password = process.env.NICKAI_SOCIAL_PASSWORD;
  if (!password) {
    return new NextResponse("nickai section is not configured (NICKAI_SOCIAL_PASSWORD unset)", {
      status: 503,
    });
  }

  const expected = await sha256Hex(password);
  if (request.cookies.get(AUTH_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/nickai/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/nickai/:path*"],
};
