/**
 * Server-safe metadata for static (non-animated) share visuals.
 *
 * No Remotion imports — safe for Server Components, sidebars, and redirects.
 * Keep ids in sync with routes under `/static/[id]`.
 */
export type StaticEntryMeta = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export const staticManifest: StaticEntryMeta[] = [
  {
    id: "performance-card",
    label: "Performance Card",
    width: 650,
    height: 1136,
  },
];

export function getStaticEntryMeta(id: string): StaticEntryMeta | undefined {
  return staticManifest.find((entry) => entry.id === id);
}
