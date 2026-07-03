import type { SocialPost } from "@/lib/nickai-social";
import { CopyButton } from "./copy-button";

/** One post: media preview, copy-paste text, downloads, source note. */
export function PostBlock({ week, post }: { week: string; post: SocialPost }) {
  const asset = (file?: string) =>
    file ? `/nickai/asset/${week}/${file.replace(/^cards\//, "")}` : null;
  const mp4 = asset(post.card.mp4);
  const png = asset(post.card.png);

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="rounded-md bg-primary-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary-400">
          {post.series}
        </span>
        <span className="text-sm font-medium text-zinc-400">{post.suggestedDay}</span>
        {post.hero && (
          <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
            hero
          </span>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {mp4 ? (
            <video controls muted playsInline poster={png ?? undefined} className="w-full rounded-xl">
              <source src={mp4} type="video/mp4" />
            </video>
          ) : png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={png} alt={post.slug} className="w-full rounded-xl" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
              no media
            </div>
          )}
          <div className="mt-2 flex gap-4 text-sm">
            {mp4 && (
              <a href={mp4} download className="text-primary-400 hover:text-primary-300">
                Download MP4
              </a>
            )}
            {png && (
              <a href={png} download className="text-primary-400 hover:text-primary-300">
                Download PNG
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-[15px] leading-relaxed text-zinc-100">
            {post.text}
          </p>
          <div className="flex items-center gap-3">
            <CopyButton text={post.text} />
            <span className="text-xs text-zinc-500">{post.text.length} chars</span>
          </div>
          {post.thread && post.thread.length > 0 && (
            <div className="space-y-2">
              {post.thread.map((t, i) => (
                <p key={i} className="rounded-lg border border-zinc-800 p-3 text-sm text-zinc-300">
                  {i + 2}. {t}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs leading-relaxed text-zinc-500">source: {post.source}</p>
        </div>
      </div>
    </article>
  );
}
