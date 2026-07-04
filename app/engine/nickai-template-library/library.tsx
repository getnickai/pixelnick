"use client";

/**
 * NickAI Template Library — all library workflow templates as Blueprint videos.
 *
 * Engine = the Workflow Template Card Remotion composition fed per-template
 * props, with archived MP4/PNG downloads from public/workflow-templates/.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Download } from "lucide-react";
import {
  TEMPLATES,
  TEMPLATE_SLUGS,
} from "@/remotion/compositions/workflow-template-card/data/templates.generated";
import type { TemplateGraph } from "@/remotion/compositions/workflow-template-card/props";
import {
  calcWorkflowTemplateMetadata,
  type WorkflowTemplateCardProps,
} from "@/remotion/compositions/workflow-template-card/props";
import { WorkflowTemplateCardComposition } from "@/remotion/compositions/workflow-template-card/composition";
import { cn } from "@/lib/utils";

const W = 650;
const H = 1136;
const FIT_PAD = 80;

type ViewMode = "static" | "animation";

function metaFor(template: TemplateGraph) {
  return calcWorkflowTemplateMetadata({
    props: { template, ratio: "portrait" },
  });
}

export function NickAiTemplateLibrary() {
  const [slug, setSlug] = useState<string>(TEMPLATE_SLUGS[0] ?? "btc-buy-the-dip");
  const [mode, setMode] = useState<ViewMode>("animation");
  const [scale, setScale] = useState(1);

  const template = TEMPLATES[slug];
  const inputProps = useMemo<WorkflowTemplateCardProps>(
    () => ({ template, ratio: "portrait" }),
    [template],
  );
  const { durationInFrames, fps } = useMemo(() => metaFor(template), [template]);

  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () =>
      setScale(
        Math.min(
          (stage.clientWidth - FIT_PAD) / W,
          (stage.clientHeight - FIT_PAD) / H,
          1,
        ),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const mp4Url = `/workflow-templates/${slug}.mp4`;
  const pngUrl = `/workflow-templates/${slug}.png`;

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-sidebar-border px-4 py-5">
        <div>
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
            {(["static", "animation"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                  mode === m
                    ? "bg-primary-500/15 text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Templates ({TEMPLATE_SLUGS.length})
          </p>
          <nav className="flex flex-col gap-1">
            {TEMPLATE_SLUGS.map((s) => {
              const t = TEMPLATES[s];
              const active = s === slug;
              return (
                <button
                  key={s}
                  aria-pressed={active}
                  onClick={() => setSlug(s)}
                  title={t.name}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-primary-500/50 bg-primary-500/10 text-zinc-50"
                      : "border-transparent bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  )}
                >
                  <span className="truncate text-xs font-medium">{t.name}</span>
                  <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                    {t.prompt}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border pt-4">
          <a
            href={mp4Url}
            download={`${slug}.mp4`}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="size-3.5" />
            Download MP4
          </a>
          <a
            href={pngUrl}
            download={`${slug}.png`}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="size-3.5" />
            Download PNG (poster)
          </a>
        </div>
      </aside>

      <main
        ref={stageRef}
        className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden"
      >
        <p className="absolute left-5 top-4 max-w-md text-xs text-muted-foreground">
          {template.description}
        </p>
        <div
          className="shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{
            width: Math.round(W * scale),
            height: Math.round(H * scale),
          }}
        >
          <Player
            key={`${mode}-${slug}`}
            component={WorkflowTemplateCardComposition}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={W}
            compositionHeight={H}
            style={{ width: "100%", height: "100%" }}
            numberOfSharedAudioTags={0}
            initialFrame={mode === "static" ? durationInFrames - 1 : 0}
            autoPlay={mode === "animation"}
            loop={mode === "animation"}
            controls={mode === "animation"}
            clickToPlay={mode === "animation"}
            acknowledgeRemotionLicense
          />
        </div>
      </main>
    </div>
  );
}
