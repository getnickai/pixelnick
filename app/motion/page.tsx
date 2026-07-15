import Link from "next/link";
import { Film } from "lucide-react";
import { motionManifest } from "@/remotion/manifest";

function formatDuration(frames: number, fps: number): string {
  if (frames <= 1) return "Still";
  const totalSeconds = frames / fps;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1).replace(/\.0$/, "")}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Motion gallery — every composition as a clickable card.
 * Replaces the old left sidebar; `/motion/[id]` is the player view.
 */
export default function MotionIndex() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Motion
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a composition to preview and export.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {motionManifest.map((entry) => {
          const aspect = entry.width / entry.height;
          return (
            <li key={entry.id}>
              <Link
                href={`/motion/${entry.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition-colors hover:border-primary-500/50"
              >
                <div className="relative flex h-44 w-full items-center justify-center bg-zinc-950">
                  <div
                    className="relative max-h-36 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-zinc-800"
                    style={{
                      width: aspect >= 1 ? "78%" : undefined,
                      height: aspect < 1 ? "90%" : undefined,
                      aspectRatio: `${entry.width} / ${entry.height}`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(1,120,255,0.18),transparent_55%)]" />
                    <Film className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-hover:text-primary-500" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
                  <p className="truncate text-sm font-medium text-zinc-50 group-hover:text-primary-400">
                    {entry.label}
                  </p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    {entry.width}×{entry.height}
                    <span className="mx-1.5 text-zinc-700">·</span>
                    {formatDuration(entry.durationInFrames, entry.fps)}
                    <span className="mx-1.5 text-zinc-700">·</span>
                    {entry.fps}fps
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
