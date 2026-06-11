/**
 * Server-safe metadata for the Pixelnick Engine section — interactive,
 * data-driven surfaces (vs. the design dashboards under /static and /motion).
 *
 * No component imports — safe for Server Components, sidebars, and redirects.
 * Keep ids in sync with the literal routes under `app/engine/`.
 */
export type EngineEntryMeta = {
  id: string;
  label: string;
  /** Short mono annotation shown in the section sidebar (e.g. data source). */
  meta?: string;
};

export const engineManifest: EngineEntryMeta[] = [
  {
    id: "swarm-arena-kit",
    label: "Swarm Arena Kit",
    meta: "live R2",
  },
];

export function getEngineEntryMeta(id: string): EngineEntryMeta | undefined {
  return engineManifest.find((entry) => entry.id === id);
}
