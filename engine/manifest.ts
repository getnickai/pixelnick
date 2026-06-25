/**
 * Server-safe metadata for the Pixelnick Engine section — interactive,
 * data-driven surfaces (vs. the design dashboards under /static and /motion).
 *
 * No component imports — safe for Server Components, sidebars, and redirects.
 * Keep ids in sync with the literal routes under `app/engine/`.
 */
export type EngineEntryMeta = {
  id: string;
  /** Full label — used by breadcrumbs and page titles. */
  label: string;
  /** Section group shown as the sidebar heading (e.g. "Swarm Arena"). */
  group?: string;
  /** Condensed display name for sidebar entries (falls back to label). */
  shortLabel?: string;
  /** Short mono annotation shown in the section sidebar (e.g. data source). */
  meta?: string;
};

export const engineManifest: EngineEntryMeta[] = [
  {
    id: "swarm-arena-kit",
    label: "Swarm Arena Kit",
    group: "Swarm Arena",
    shortLabel: "Kit",
    meta: "live R2",
  },
  {
    id: "swarm-arena-history",
    label: "Swarm Arena History",
    group: "Swarm Arena",
    shortLabel: "History",
    meta: "live R2",
  },
  {
    id: "nickai-kit",
    label: "NickAI Kit",
    group: "NickAI",
    shortLabel: "Kit",
    meta: "live R2",
  },
  {
    id: "nickai-history",
    label: "NickAI History",
    group: "NickAI",
    shortLabel: "History",
    meta: "live R2",
  },
  {
    id: "x-signals",
    label: "X Signals",
    group: "X Engine",
    shortLabel: "Signals",
    meta: "x-engine",
  },
  {
    id: "x-posts",
    label: "X Proposed posts",
    group: "X Engine",
    shortLabel: "Proposed posts",
    meta: "x-engine",
  },
  {
    id: "x-performance",
    label: "X Performance",
    group: "X Engine",
    shortLabel: "Performance",
    meta: "x-engine",
  },
  {
    id: "agentic-drop",
    label: "Agentic Drop",
    group: "X Engine",
    shortLabel: "Agentic Drop",
    meta: "carousel",
  },
  {
    id: "agentic-drop-history",
    label: "Agentic Drop History",
    group: "X Engine",
    shortLabel: "Drop History",
    meta: "archive",
  },
];

export function getEngineEntryMeta(id: string): EngineEntryMeta | undefined {
  return engineManifest.find((entry) => entry.id === id);
}
