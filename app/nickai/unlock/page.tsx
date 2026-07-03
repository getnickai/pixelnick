/**
 * Unlock page for the /nickai section (STA-473). Verifies the shared team
 * password and sets the auth cookie the proxy checks. Kept deliberately
 * dependency-free: one form, one server action.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "nickai_social_auth";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function unlock(formData: FormData) {
  "use server";
  const password = process.env.NICKAI_SOCIAL_PASSWORD;
  const attempt = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/nickai");
  const target = next.startsWith("/nickai") ? next : "/nickai";
  if (!password || attempt !== password) {
    redirect(`/nickai/unlock?error=1&next=${encodeURIComponent(target)}`);
  }
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, await sha256Hex(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  redirect(target);
}

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <form action={unlock} className="w-full max-w-sm space-y-4">
        <h1 className="font-heading text-2xl font-semibold text-zinc-50">NickAI social</h1>
        <p className="text-sm text-zinc-400">Team password to view the content calendar.</p>
        <input type="hidden" name="next" value={params.next ?? "/nickai"} />
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Password"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-primary-500"
        />
        {params.error && <p className="text-sm text-red-400">Wrong password, try again.</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary-500 px-4 py-3 font-medium text-white hover:bg-primary-600"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}
