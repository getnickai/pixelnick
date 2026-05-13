import type { ComponentType } from "react";
import {
  PerformanceCardComposition,
} from "./compositions/performance-card/composition";
import {
  performanceCardDefaultProps,
  type PerformanceCardProps,
} from "./compositions/performance-card/props";
import {
  motionManifest,
  type MotionEntryMeta,
} from "./manifest";

/**
 * Full motion registry — metadata from `./manifest.ts` paired with each
 * composition's React component and default props.
 *
 * **Client-only.** Importing this file pulls in `remotion`, which initialises
 * React contexts at module load. That makes it incompatible with React Server
 * Components. Anywhere in a Server Component, import from `./manifest.ts`
 * instead — that file is component-ref-free and safe in RSC.
 *
 * Consumed by:
 *   - `app/motion/[componentId]/page.tsx` (client) to feed `<Player>`
 *   - future automation services (`renderMediaOnLambda({ composition: id })`)
 *
 * Adding a new animatable component:
 *   1. Add an entry to `./manifest.ts` (server-safe metadata).
 *   2. Add a binding below mapping the manifest id → `{ component, defaultProps }`.
 */
export type MotionEntry<P = Record<string, unknown>> = MotionEntryMeta & {
  defaultProps: P;
  component: ComponentType<P>;
};

type ComponentBinding<P = unknown> = {
  component: ComponentType<P>;
  defaultProps: P;
};

const componentBindings: Record<string, ComponentBinding> = {
  "performance-card": {
    component: PerformanceCardComposition,
    defaultProps: performanceCardDefaultProps,
  } as ComponentBinding<PerformanceCardProps> as ComponentBinding,
};

export const motionRegistry: MotionEntry[] = motionManifest
  .map((meta) => {
    const binding = componentBindings[meta.id];
    if (!binding) {
      // Manifest entry without a binding (e.g. composition is planned but not
      // yet built). Skip it — the sidebar can still list it from the manifest,
      // and `getMotionEntry` returns undefined so the Player page 404s cleanly.
      if (typeof console !== "undefined") {
        console.warn(
          `motionRegistry: manifest entry "${meta.id}" has no component ` +
            `binding. Add one in remotion/registry.ts to make it playable.`,
        );
      }
      return null;
    }
    return { ...meta, ...binding } as MotionEntry;
  })
  .filter((entry): entry is MotionEntry => entry !== null);

/** Client-side lookup that includes the component reference. */
export function getMotionEntry(id: string): MotionEntry | undefined {
  return motionRegistry.find((entry) => entry.id === id);
}
