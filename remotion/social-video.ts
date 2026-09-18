/** Shared render controls for the two bounded organic-film compositions. */
export interface SocialRenderOptions {
  duration_seconds?: number;
  audio_volume?: number;
}

/** Reject unsupported controls before accepting a CPU-intensive render request. */
export function validSocialRenderOptions(value: unknown, maxSeconds: number): value is SocialRenderOptions | undefined {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const options = value as Record<string, unknown>;
  if (Object.keys(options).some((key) => !['duration_seconds', 'audio_volume'].includes(key))) return false;
  return (options.duration_seconds === undefined || (typeof options.duration_seconds === 'number' && Number.isFinite(options.duration_seconds) && options.duration_seconds >= 12 && options.duration_seconds <= maxSeconds))
    && (options.audio_volume === undefined || (typeof options.audio_volume === 'number' && Number.isFinite(options.audio_volume) && options.audio_volume >= 0 && options.audio_volume <= 1));
}

/** Shared by the render root and preview metadata so pacing preserves the final scene. */
export function socialVideoFrames(version: 1 | 2, options?: SocialRenderOptions): number {
  return Math.round((options?.duration_seconds ?? (version === 1 ? 22 : 25)) * (version === 1 ? 30 : 24));
}
