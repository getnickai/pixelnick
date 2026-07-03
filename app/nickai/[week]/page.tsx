/** /nickai/[week] — the week's posts, day by day (STA-473 CP6). */
import Link from "next/link";
import { getWeekBatch } from "@/lib/nickai-social";
import { PostBlock } from "@/components/nickai-social/post-block";

export const dynamic = "force-dynamic";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function WeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const batch = /^\d{4}-W\d{2}$/.test(week) ? await getWeekBatch(week) : null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-8 bg-zinc-950 px-6 py-12">
      <header className="flex items-baseline justify-between">
        <h1 className="font-heading text-3xl font-semibold text-zinc-50">{week}</h1>
        <Link href="/nickai" className="text-sm text-primary-400 hover:text-primary-300">
          All weeks
        </Link>
      </header>

      {!batch ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
          No batch published for this week.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {batch.posts.length} posts · status {batch.status} · generated {batch.generatedAt}
          </p>
          <div className="space-y-6">
            {[...batch.posts]
              .sort(
                (a, b) => DAY_ORDER.indexOf(a.suggestedDay) - DAY_ORDER.indexOf(b.suggestedDay),
              )
              .map((post) => (
                <PostBlock key={post.slug} week={week} post={post} />
              ))}
          </div>
        </>
      )}
    </main>
  );
}
