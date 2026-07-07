import crypto from "node:crypto";
import { NextResponse } from "next/server";

// X (Twitter) Conversion API relay.
//
// PostHog can't sign OAuth 1.0a, so it POSTs events here (HTTP Webhook
// destination) and this route signs + forwards to X's Conversion API.
//   PostHog event -> POST /api/x-capi -> ads-api.twitter.com/.../measurement/conversions/<pixel>
//
// Required env (Vercel project settings):
//   X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET  (OAuth 1.0a)
//   X_PIXEL_ID                e.g. r99bs
//   X_PURCHASE_EVENT_ID       e.g. tw-r99bs-r99bt   (maps from subscription_started)
//   X_SIGNUP_EVENT_ID         e.g. tw-r99bs-xxxxx   (maps from user_signed_up)
//   X_RELAY_SECRET            shared secret; PostHog must send it as the x-relay-secret header

export const runtime = "nodejs"; // needs node:crypto
export const dynamic = "force-dynamic";

const X_API_BASE = "https://ads-api.twitter.com/12";

// RFC 3986 percent-encoding (encodeURIComponent leaves !*'() unescaped).
const pct = (s: string) =>
  encodeURIComponent(s).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

interface Creds {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

// OAuth 1.0a header. JSON request bodies are NOT part of the signature base string.
function oauthHeader(method: string, url: string, c: Creds): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: c.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: c.accessToken,
    oauth_version: "1.0",
  };
  const params = Object.keys(oauth)
    .sort()
    .map((k) => `${pct(k)}=${pct(oauth[k])}`)
    .join("&");
  const base = [method.toUpperCase(), pct(url), pct(params)].join("&");
  const key = `${pct(c.consumerSecret)}&${pct(c.accessTokenSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", key).update(base).digest("base64");
  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${pct(k)}="${pct(oauth[k])}"`)
      .join(", ")
  );
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

// Constant-time compare so the shared secret can't be guessed via timing.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// PostHog event name -> X conversion event id (configured in X Events Manager).
function eventIdFor(event: string): string | undefined {
  if (event === "subscription_started") return process.env.X_PURCHASE_EVENT_ID;
  // signup_confirmed is the relayed signup (a PostHog workflow emits it ~1h after
  // user_signed_up, once the email and click IDs have attached to the person).
  if (event === "user_signed_up" || event === "signup_confirmed") return process.env.X_SIGNUP_EVENT_ID;
  return undefined;
}

export async function POST(req: Request) {
  const relaySecret = process.env.X_RELAY_SECRET;
  if (!relaySecret || !safeEqual(req.headers.get("x-relay-secret") ?? "", relaySecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = String(body.event ?? "");
  const eventId = eventIdFor(event);
  if (!eventId) {
    return NextResponse.json({ error: `no X event mapping for '${event}'` }, { status: 422 });
  }

  // Prefer a pre-hashed email from PostHog (no plaintext PII at the relay);
  // fall back to hashing a raw email if that's all we got.
  const hashedEmail =
    (typeof body.hashed_email === "string" && body.hashed_email) ||
    (typeof body.email === "string" && body.email ? sha256(body.email) : "");
  const twclid = typeof body.twclid === "string" ? body.twclid : "";
  if (!hashedEmail && !twclid) {
    return NextResponse.json({ error: "missing email / hashed_email / twclid" }, { status: 422 });
  }

  // X matches a conversion on any identifier; send the twclid (direct click match)
  // and/or the hashed email.
  const identifiers: Record<string, string>[] = [];
  if (twclid) identifiers.push({ twclid });
  if (hashedEmail) identifiers.push({ hashed_email: hashedEmail });

  const conversion: Record<string, unknown> = {
    // X wants yyyy-MM-ddTHH:mm:ss.SSSZ; toISOString() produces exactly that.
    conversion_time:
      typeof body.conversion_time === "string" ? body.conversion_time : new Date().toISOString(),
    event_id: eventId,
    identifiers,
  };
  // conversion_id dedups retries (use the PostHog event uuid).
  if (body.conversion_id) conversion.conversion_id = String(body.conversion_id);
  // value is in the conversion event's configured currency (X has no per-call currency field).
  if (body.value != null && body.value !== "") conversion.value = String(body.value);

  const creds: Creds = {
    consumerKey: process.env.X_CONSUMER_KEY ?? "",
    consumerSecret: process.env.X_CONSUMER_SECRET ?? "",
    accessToken: process.env.X_ACCESS_TOKEN ?? "",
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET ?? "",
  };
  if (!creds.consumerKey || !creds.accessToken) {
    return NextResponse.json({ error: "relay not configured" }, { status: 500 });
  }

  const url = `${X_API_BASE}/measurement/conversions/${process.env.X_PIXEL_ID}`;
  const xRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", url, creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversions: [conversion] }),
  });
  const xText = await xRes.text();

  if (!xRes.ok) {
    console.error("x-capi relay: X API error", xRes.status, xText);
    return NextResponse.json({ ok: false, status: xRes.status, body: xText }, { status: 502 });
  }
  return NextResponse.json({ ok: true, x: JSON.parse(xText) });
}
