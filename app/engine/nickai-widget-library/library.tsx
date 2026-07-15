"use client";

/**
 * NickAI Widget Library — browsable catalog of the meta-agent chat card
 * designs, light + dark, each downloadable as a 2x PNG. Static captures of the
 * real components (see manifest.ts). The single place marketing pulls a widget
 * visual from for any channel.
 */
import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIDGET_COUNT,
  WIDGET_GROUPS,
  WIDGETS,
  type WidgetMeta,
} from "./manifest";

type Theme = "light" | "dark";

function srcFor(w: WidgetMeta, theme: Theme) {
  return `/widget-library/${theme}/${w.slug}.png`;
}

function WidgetTile({ w, theme }: { w: WidgetMeta; theme: Theme }) {
  const [copied, setCopied] = useState(false);
  const src = srcFor(w, theme);
  const file = `${w.slug}-${theme}.png`;

  return (
    <figure className="group flex flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar/40">
      {/* Canvas: matches the selected theme so card edges read cleanly. */}
      <div
        className={cn(
          "flex items-center justify-center p-5",
          theme === "dark" ? "bg-zinc-950" : "bg-zinc-100",
        )}
      >
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          title="Open full size"
          className="block w-full max-w-[300px]"
        >
          <Image
            src={src}
            alt={w.label}
            width={w.w}
            height={w.h}
            unoptimized
            className="h-auto w-full rounded-lg shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </a>
      </div>

      <figcaption className="flex items-center justify-between gap-2 border-sidebar-border border-t px-3 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-zinc-200">
            {w.label}
          </span>
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {w.tool ?? "card"} · {w.w}×{w.h}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="Copy public path"
            onClick={() => {
              navigator.clipboard.writeText(src);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            {copied ? (
              <Check className="size-3.5 text-primary-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
          <a
            href={src}
            download={file}
            title="Download PNG"
            className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Download className="size-3.5" />
          </a>
        </div>
      </figcaption>
    </figure>
  );
}

export function NickAiWidgetLibrary() {
  const [theme, setTheme] = useState<Theme>("dark");
  const byGroup = useMemo(
    () =>
      WIDGET_GROUPS.map((group) => ({
        group,
        items: WIDGETS.filter((w) => w.group === group),
      })).filter((g) => g.items.length > 0),
    [],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-sidebar-border border-b px-6 py-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-100">
            Widget Library
          </span>
          <span className="text-muted-foreground text-xs">
            {WIDGET_COUNT} meta-agent chat cards · real components · 2× PNG
          </span>
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-input bg-zinc-900 p-0.5">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                theme === t
                  ? "bg-primary-500/15 text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable catalog */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-9">
          {byGroup.map(({ group, items }) => (
            <section key={group} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <h2 className="font-semibold text-xs uppercase tracking-wider text-zinc-400">
                  {group}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                {items.map((w) => (
                  <WidgetTile key={w.slug} w={w} theme={theme} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
