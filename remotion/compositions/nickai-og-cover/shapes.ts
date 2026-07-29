export type NickaiOgShapeId =
  | "nick-logo"
  | `set-${1 | 2 | 3}-${string}`;

export type NickaiOgShapeOption = {
  id: NickaiOgShapeId;
  label: string;
  assetPath: string;
};

export type NickaiOgShapeGroup = {
  id: "brand" | `set-${1 | 2 | 3}`;
  label: string;
  options: NickaiOgShapeOption[];
};

const makeSet = (
  set: 1 | 2 | 3,
  count: number,
): NickaiOgShapeGroup => ({
  id: `set-${set}`,
  label: `Set ${set}`,
  options: Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const id = `set-${set}-${number}` as NickaiOgShapeId;
    return {
      id,
      label: `Set ${set} · ${number}`,
      assetPath: `nickai-og/shapes/${id}.svg`,
    };
  }),
});

export const NICKAI_OG_SHAPE_GROUPS: NickaiOgShapeGroup[] = [
  {
    id: "brand",
    label: "Brand",
    options: [
      {
        id: "nick-logo",
        label: "Nick logo",
        assetPath: "nickai-og/shapes/nick-logo.svg",
      },
    ],
  },
  makeSet(1, 28),
  makeSet(2, 20),
  makeSet(3, 50),
];

export const NICKAI_OG_SHAPE_OPTIONS =
  NICKAI_OG_SHAPE_GROUPS.flatMap(({ options }) => options);

export const defaultNickaiOgShapeId: NickaiOgShapeId = "nick-logo";

const optionsById = new Map(
  NICKAI_OG_SHAPE_OPTIONS.map((option) => [option.id, option]),
);

export function isNickaiOgShapeId(value: string): value is NickaiOgShapeId {
  return optionsById.has(value as NickaiOgShapeId);
}

export function getNickaiOgShapeOption(
  id: NickaiOgShapeId,
): NickaiOgShapeOption {
  return (
    optionsById.get(id) ??
    optionsById.get(defaultNickaiOgShapeId)!
  );
}
