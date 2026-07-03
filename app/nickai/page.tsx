/**
 * /nickai — today's post + week browser (STA-473 CP6).
 * force-dynamic: never cache an empty manifest (pixelnick has been bitten by
 * cached-empty responses twice; the section is gated and low-traffic anyway).
 */
import Link from "next/link";
import { getWeekBatch, listWeeks } from "@/lib/nickai-social";
import { PostBlock } from "@/components/nickai-social/post-block";

export const dynamic = "force-dynamic";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayShort(): string {
  const dubai = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
  return DAY_SHORT[dubai.getDay()];
}

export default async function NickaiSocialHome() {
  const weeks = await listWeeks();
  const latestWeek = weeks[0];
  const latest = latestWeek ? await getWeekBatch(latestWeek) : null;
  const today = todayShort();
  const todaysPost = latest?.posts.find((p) => p.suggestedDay === today);

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-10 bg-zinc-950 px-6 py-12">
      <header className="flex items-baseline justify-between">
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">NickAI social calendar</h1>
        <span className="text-sm text-zinc-500">{today}</span>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-300">Today</h2>
        {todaysPost && latestWeek ? (
          <PostBlock week={latestWeek} post={todaysPost} />
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
            No post scheduled for {today}
            {latestWeek ? (
              <>
                {" "}
                — see <Link href={`/nickai/${latestWeek}`} className="text-primary-400">{latestWeek}</Link>.
              </>
            ) : (
              "."
            )}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-300">Weeks</h2>
        {weeks.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing published yet.</p>
        ) : (
          <ul className="space-y-2">
            {weeks.map((week) => (
              <li key={week}>
                <Link
                  href={`/nickai/${week}`}
                  className="block rounded-xl border border-zinc-800 px-5 py-4 text-zinc-200 hover:border-primary-500"
                >
                  {week}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
