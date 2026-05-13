"use client";

import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import type { MotionEntry } from "@/remotion/registry";

export function PlayerHost({ entry }: { entry: MotionEntry }) {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);

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

  return (
    <div
      className="group relative overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-grey-800"
      style={{
        width: `min(100%, calc((100dvh - 8rem) * ${entry.width / entry.height}))`,
        aspectRatio: `${entry.width} / ${entry.height}`,
      }}
    >
      <Player
        ref={playerRef}
        component={entry.component}
        inputProps={entry.defaultProps}
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
  );
}
