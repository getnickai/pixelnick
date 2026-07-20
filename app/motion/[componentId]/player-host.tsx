"use client";

import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronsUpDown,
  Download,
  Hash,
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MotionEntry } from "@/remotion/registry";

export function PlayerHost({ entry }: { entry: MotionEntry }) {
  const playerRef = useRef<PlayerRef>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  // Live preview controls. These overlay the Player and write back into the
  // composition via `inputProps`. Currently only the Performance Card reads
  // `slide`; for any other composition the value is simply ignored.
  const [slide, setSlide] = useState(true);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      if (!scrubbing) setCurrentFrame(e.detail.frame);
    };
    const onSeeked = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("frameupdate", onFrameUpdate);
    p.addEventListener("seeked", onSeeked);
    setCurrentFrame(p.getCurrentFrame());
    return () => {
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("frameupdate", onFrameUpdate);
      p.removeEventListener("seeked", onSeeked);
    };
  }, [scrubbing, entry.id]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === frameRef.current;
      setFullscreen(active);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) {
      p.pause();
    } else {
      p.play();
    }
  }, []);

  const seekToFrame = useCallback(
    (frame: number) => {
      const p = playerRef.current;
      if (!p) return;
      const clamped = Math.max(
        0,
        Math.min(entry.durationInFrames - 1, Math.round(frame)),
      );
      p.seekTo(clamped);
      setCurrentFrame(clamped);
    },
    [entry.durationInFrames],
  );

  const toggleFullscreen = useCallback(async () => {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      if (document.fullscreenElement === frame) {
        await document.exitFullscreen();
      } else {
        await frame.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser; leave preview as-is.
    }
  }, []);

  // Canvas shortcuts: Space = play/pause, F = fullscreen. Active while the
  // frame is hovered, focused, or in fullscreen — not while typing elsewhere.
  const canvasActiveRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const frame = frameRef.current;
      if (!frame) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const active =
        canvasActiveRef.current ||
        document.fullscreenElement === frame ||
        frame === document.activeElement ||
        (document.activeElement != null &&
          frame.contains(document.activeElement));
      if (!active) return;

      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        toggle();
        return;
      }

      if (
        (e.key === "f" || e.key === "F") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        void toggleFullscreen();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle, toggleFullscreen]);

  // Memoise inputProps so the Player only re-renders when toggle state changes,
  // not on every parent render. `entry.defaultProps` is captured once via the
  // entry id changing — when navigating to a different composition the parent
  // remounts this component (key={componentId}), resetting everything.
  const inputProps = useMemo(
    () => ({ ...entry.defaultProps, slide }),
    [entry.defaultProps, slide],
  );

  const exportVideo = useCallback(async () => {
    if (exporting) return;

    setExporting(true);
    setExportError(null);

    try {
      const response = await fetch("/api/motion/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, inputProps }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "The video could not be rendered.");
      }

      const video = await response.blob();
      const url = URL.createObjectURL(video);
      const download = document.createElement("a");
      download.href = url;
      download.download = `${entry.id}.mp4`;
      document.body.appendChild(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "The video could not be rendered.",
      );
    } finally {
      setExporting(false);
    }
  }, [entry.id, exporting, inputProps]);

  const aspect = entry.width / entry.height;
  // Cap at the composition's intrinsic frame width (e.g. 650px) so wide-aspect
  // entries don't blow up to the full main column; still shrink on narrow viewports.
  const playerWidth = `min(${entry.width}px, 100%, calc((100dvh - 8rem) * ${aspect}))`;

  // Outer `w-full` so player `min(100%, …)` resolves against the main column,
  // not the shrink-wrapped toggle width.
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {!fullscreen ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ModeToggle slide={slide} onSlideChange={setSlide} />
          <button
            type="button"
            onClick={() => void exportVideo()}
            disabled={exporting}
            aria-describedby={exportError ? "motion-export-error" : undefined}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70"
          >
            {exporting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exporting ? "Rendering…" : "Export video"}
          </button>
        </div>
      ) : null}

      {exportError && !fullscreen ? (
        <p id="motion-export-error" role="alert" className="text-sm text-red-400">
          {exportError}
        </p>
      ) : null}

      <div
        className="relative"
        style={{
          width: playerWidth,
          aspectRatio: `${entry.width} / ${entry.height}`,
        }}
      >
        <div
          ref={frameRef}
          tabIndex={0}
          role="application"
          aria-label={`${entry.label} player. Space plays or pauses. F toggles fullscreen. Drag the timeline to scrub.`}
          className={cn(
            "group absolute inset-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            fullscreen &&
              "fixed inset-0 z-50 flex items-center justify-center rounded-none bg-black shadow-none ring-0",
          )}
          onMouseEnter={() => {
            canvasActiveRef.current = true;
            setControlsVisible(true);
          }}
          onMouseLeave={() => {
            canvasActiveRef.current = fullscreen;
            if (!scrubbing) setControlsVisible(false);
          }}
          onFocus={() => {
            canvasActiveRef.current = true;
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              canvasActiveRef.current = fullscreen;
            }
          }}
          onClick={() => frameRef.current?.focus()}
        >
          <div
            className="relative size-full"
            style={
              fullscreen
                ? {
                    aspectRatio: `${entry.width} / ${entry.height}`,
                    width: `min(100dvw, calc(100dvh * ${aspect}))`,
                    height: `min(100dvh, calc(100dvw / ${aspect}))`,
                  }
                : undefined
            }
          >
            <Player
              ref={playerRef}
              component={entry.component}
              inputProps={inputProps}
              durationInFrames={entry.durationInFrames}
              fps={entry.fps}
              compositionWidth={entry.width}
              compositionHeight={entry.height}
              style={{ width: "100%", height: "100%" }}
              // This composition has no audio. numberOfSharedAudioTags={0} prevents
              // Remotion from creating a Web Audio AudioContext, which otherwise blocks
              // the animation loop waiting for AudioContext.resume() to be confirmed
              // via requestAnimationFrame — a confirmation gated behind a user gesture.
              numberOfSharedAudioTags={0}
              loop
              // Space is handled on the canvas frame below so it works while
              // hovered/focused without Remotion double-toggling.
              spaceKeyToPlayOrPause={false}
              acknowledgeRemotionLicense
            />
          </div>

          {/* Timeline + play / fullscreen — one row, hover-only */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pb-4 pt-8 transition-opacity duration-200"
            style={{
              opacity: controlsVisible || scrubbing ? 1 : 0,
              pointerEvents: controlsVisible || scrubbing ? "auto" : "none",
            }}
            onMouseEnter={() => setControlsVisible(true)}
            onClick={(e) => e.stopPropagation()}
          >
            <ControlButton
              onClick={toggle}
              label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="size-4 fill-white text-white" />
              ) : (
                <Play className="size-4 fill-white text-white" />
              )}
            </ControlButton>
            <p className="shrink-0 font-mono text-[11px] tabular-nums text-white/80">
              {formatTimecode(currentFrame, entry.fps)}
              <span className="text-white/40"> / </span>
              {formatTimecode(entry.durationInFrames, entry.fps)}
            </p>
            <TimelineScrubber
              frame={currentFrame}
              durationInFrames={entry.durationInFrames}
              fps={entry.fps}
              onSeek={seekToFrame}
              onScrubbingChange={(next) => {
                setScrubbing(next);
                if (!next && !canvasActiveRef.current) {
                  setControlsVisible(false);
                }
              }}
            />
            <ControlButton
              onClick={toggleFullscreen}
              label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? (
                <Minimize className="size-4 text-white" />
              ) : (
                <Maximize className="size-4 text-white" />
              )}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.max(0, frame) / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function TimelineScrubber({
  frame,
  durationInFrames,
  fps,
  onSeek,
  onScrubbingChange,
}: {
  frame: number;
  durationInFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
  onScrubbingChange: (scrubbing: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const progress =
    durationInFrames <= 1
      ? 0
      : Math.min(1, Math.max(0, frame / (durationInFrames - 1)));

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || durationInFrames <= 1) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio * (durationInFrames - 1));
    },
    [durationInFrames, onSeek],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      seekFromClientX(e.clientX);
    };
    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      onScrubbingChange(false);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onScrubbingChange, seekFromClientX]);

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Timeline"
      aria-valuemin={0}
      aria-valuemax={durationInFrames - 1}
      aria-valuenow={frame}
      aria-valuetext={formatTimecode(frame, fps)}
      className="group/scrubber relative flex h-5 min-w-0 flex-1 cursor-pointer items-center outline-none"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        draggingRef.current = true;
        onScrubbingChange(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        seekFromClientX(e.clientX);
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? Math.round(fps) : Math.max(1, Math.round(fps / 10));
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          onSeek(frame - step);
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          onSeek(frame + step);
        } else if (e.key === "Home") {
          e.preventDefault();
          e.stopPropagation();
          onSeek(0);
        } else if (e.key === "End") {
          e.preventDefault();
          e.stopPropagation();
          onSeek(durationInFrames - 1);
        }
      }}
    >
      <div className="absolute inset-x-0 h-1 rounded-full bg-white/25 transition-[height] group-hover/scrubber:h-1.5" />
      <div
        className="absolute left-0 h-1 rounded-full bg-primary-500 transition-[height] group-hover/scrubber:h-1.5"
        style={{ width: `${progress * 100}%` }}
      />
      <div
        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-black/30 transition-transform group-hover/scrubber:scale-110"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function ModeToggle({
  slide,
  onSlideChange,
}: {
  slide: boolean;
  onSlideChange: (next: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Count-up display mode"
      className="flex flex-row overflow-hidden rounded-md bg-zinc-900/60 ring-1 ring-zinc-800 backdrop-blur-sm"
    >
      <ModeToggleButton
        active={slide}
        onClick={() => onSlideChange(true)}
        label="Slide"
        title="Slot-machine — digits slide vertically between values"
      >
        <ChevronsUpDown className="size-4" />
      </ModeToggleButton>
      <div aria-hidden className="w-px self-stretch bg-zinc-800" />
      <ModeToggleButton
        active={!slide}
        onClick={() => onSlideChange(false)}
        label="Counter"
        title="Counter — digits snap to their current integer each frame"
      >
        <Hash className="size-4" />
      </ModeToggleButton>
    </div>
  );
}

function ModeToggleButton({
  active,
  onClick,
  label,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={title}
      className={cn(
        "flex size-10 items-center justify-center transition-colors",
        active
          ? "bg-primary-500 text-zinc-950"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
