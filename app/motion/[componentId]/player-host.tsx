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
import { ChevronsUpDown, Hash, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MotionEntry } from "@/remotion/registry";

export function PlayerHost({ entry }: { entry: MotionEntry }) {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);

  // Live preview controls. These overlay the Player and write back into the
  // composition via `inputProps`. Currently only the Performance Card reads
  // `slide`; for any other composition the value is simply ignored.
  const [slide, setSlide] = useState(true);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    return () => {
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
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

  // Memoise inputProps so the Player only re-renders when toggle state changes,
  // not on every parent render. `entry.defaultProps` is captured once via the
  // entry id changing — when navigating to a different composition the parent
  // remounts this component (key={componentId}), resetting everything.
  const inputProps = useMemo(
    () => ({ ...entry.defaultProps, slide }),
    [entry.defaultProps, slide],
  );

  const aspect = entry.width / entry.height;
  // Cap at the composition's intrinsic frame width (e.g. 650px) so wide-aspect
  // entries don't blow up to the full main column; still shrink on narrow viewports.
  const playerWidth = `min(${entry.width}px, 100%, calc((100dvh - 8rem) * ${aspect}))`;

  // Outer `w-full` so player `min(100%, …)` resolves against the main column,
  // not the shrink-wrapped toggle width.
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ModeToggle slide={slide} onSlideChange={setSlide} />

      <div
        className="relative"
        style={{
          width: playerWidth,
          aspectRatio: `${entry.width} / ${entry.height}`,
        }}
      >
        <div className="group absolute inset-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-zinc-800">
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
            spaceKeyToPlayOrPause
            acknowledgeRemotionLicense
          />

          {/* Play / pause overlay */}
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="absolute inset-0 flex items-end justify-end p-4"
            style={{ opacity: playing ? 0 : 1, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = playing
                ? "0"
                : "1";
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20">
              {playing ? (
                <Pause className="size-4 fill-white text-white" />
              ) : (
                <Play className="size-4 fill-white text-white" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
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
