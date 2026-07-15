"use client";

/**
 * Blog & Covers — NickAI social card (free-wave X/cover) + OG cover (panel wave).
 *
 * Engine preview of the Remotion compositions used for text posts and blog
 * OG images. Static = settled PNG; animation = baked silk loop (social only).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { NickaiSocialCardComposition } from "@/remotion/compositions/nickai-social-card/composition";
import {
  nickaiSocialCardDefaultProps,
  type NickaiSocialCardProps,
} from "@/remotion/compositions/nickai-social-card/props";
import { NickaiOgCoverComposition } from "@/remotion/compositions/nickai-og-cover/composition";
import {
  nickaiOgCoverDefaultProps,
  type NickaiOgCoverProps,
} from "@/remotion/compositions/nickai-og-cover/props";
import { cn } from "@/lib/utils";

const SERIES = [
  "Product drop",
  "Trading guide",
  "Trading analysis",
  "Trading insights",
] as const;

type ViewMode = "static" | "animation";
type Theme = "dark" | "light";
type Kind = "social" | "og";

type TemplateId =
  | "social-dark"
  | "social-light"
  | "og-dark"
  | "og-light";

type Template = {
  id: TemplateId;
  kind: Kind;
  theme: Theme;
  label: string;
  blurb: string;
  width: number;
  height: number;
  /** Social card duration; OG is a still. */
  durationInFrames: number;
  fps: number;
};

const TEMPLATES: Template[] = [
  {
    id: "social-dark",
    kind: "social",
    theme: "dark",
    label: "Social card · Dark",
    blurb: "Free-wave brand frame for the weekly X calendar (1600×900).",
    width: 1600,
    height: 900,
    durationInFrames: 240,
    fps: 30,
  },
  {
    id: "social-light",
    kind: "social",
    theme: "light",
    label: "Social card · Light",
    blurb: "Same free-wave layout on the light skin.",
    width: 1600,
    height: 900,
    durationInFrames: 240,
    fps: 30,
  },
  {
    id: "og-dark",
    kind: "og",
    theme: "dark",
    label: "OG cover · Dark",
    blurb: "1200×630 blog/social OG — wave in a rounded panel.",
    width: 1200,
    height: 630,
    durationInFrames: 1,
    fps: 30,
  },
  {
    id: "og-light",
    kind: "og",
    theme: "light",
    label: "OG cover · Light",
    blurb: "Light OG twin matching getnick.ai cover treatment.",
    width: 1200,
    height: 630,
    durationInFrames: 1,
    fps: 30,
  },
];

const FIT_PAD = 80;

export function NickAiBlogCovers() {
  const [templateId, setTemplateId] = useState<TemplateId>("social-dark");
  const [series, setSeries] = useState<(typeof SERIES)[number]>("Product drop");
  const [mode, setMode] = useState<ViewMode>("static");
  const [scale, setScale] = useState(1);

  const template = TEMPLATES.find((t) => t.id === templateId)!;
  const canAnimate = template.kind === "social";
  const viewMode: ViewMode = canAnimate ? mode : "static";

  const socialProps = useMemo<NickaiSocialCardProps>(
    () => ({
      ...nickaiSocialCardDefaultProps,
      theme: template.theme,
      eyebrow: series,
      animate: viewMode === "animation",
    }),
    [template.theme, series, viewMode],
  );

  const ogProps = useMemo<NickaiOgCoverProps>(
    () => ({
      ...nickaiOgCoverDefaultProps,
      theme: template.theme,
    }),
    [template.theme],
  );

  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () =>
      setScale(
        Math.min(
          (stage.clientWidth - FIT_PAD) / template.width,
          (stage.clientHeight - FIT_PAD) / template.height,
          1,
        ),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [template.width, template.height]);

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-sidebar-border px-4 py-5">
        <div>
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
            {(["static", "animation"] as const).map((m) => {
              const disabled = m === "animation" && !canAnimate;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  aria-pressed={viewMode === m}
                  onClick={() => !disabled && setMode(m)}
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                    disabled && "cursor-not-allowed opacity-40",
                    viewMode === m
                      ? "bg-primary-500/15 text-zinc-50"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
          {!canAnimate ? (
            <p className="mt-2 px-1 text-[10px] leading-snug text-muted-foreground">
              OG covers are stills — animation is social card only.
            </p>
          ) : null}
        </div>

        {template.kind === "social" ? (
          <div>
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Series
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {SERIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={series === s}
                  onClick={() => setSeries(s)}
                  className={cn(
                    "cursor-pointer rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    series === s
                      ? "bg-primary-500/15 text-zinc-50"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Templates ({TEMPLATES.length})
          </p>
          <nav className="flex flex-col gap-1">
            {TEMPLATES.map((t) => {
              const active = t.id === templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-primary-500/50 bg-primary-500/10 text-zinc-50"
                      : "border-transparent bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  )}
                >
                  <span className="truncate text-xs font-medium">{t.label}</span>
                  <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                    {t.blurb}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <main
        ref={stageRef}
        className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden"
      >
        <p className="absolute left-5 top-4 max-w-md text-xs text-muted-foreground">
          {template.blurb}
          {template.kind === "social" ? ` Series chip: ${series}.` : null}
        </p>
        <div
          className="shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{
            width: Math.round(template.width * scale),
            height: Math.round(template.height * scale),
          }}
        >
          {template.kind === "social" ? (
            <Player
              key={`${template.id}-${series}-${viewMode}`}
              component={NickaiSocialCardComposition}
              inputProps={socialProps}
              durationInFrames={template.durationInFrames}
              fps={template.fps}
              compositionWidth={template.width}
              compositionHeight={template.height}
              style={{ width: "100%", height: "100%" }}
              numberOfSharedAudioTags={0}
              initialFrame={
                viewMode === "static" ? template.durationInFrames - 1 : 0
              }
              autoPlay={viewMode === "animation"}
              loop={viewMode === "animation"}
              controls={viewMode === "animation"}
              clickToPlay={viewMode === "animation"}
              acknowledgeRemotionLicense
            />
          ) : (
            <Player
              key={template.id}
              component={NickaiOgCoverComposition}
              inputProps={ogProps}
              durationInFrames={1}
              fps={template.fps}
              compositionWidth={template.width}
              compositionHeight={template.height}
              style={{ width: "100%", height: "100%" }}
              numberOfSharedAudioTags={0}
              initialFrame={0}
              autoPlay={false}
              loop={false}
              controls={false}
              clickToPlay={false}
              acknowledgeRemotionLicense
            />
          )}
        </div>
      </main>
    </div>
  );
}
