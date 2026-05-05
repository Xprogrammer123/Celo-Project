export const RARITY_WEIGHTS = [
  { id: 0, label: "COMMON", pct: 60 },
  { id: 1, label: "RARE", pct: 25 },
  { id: 2, label: "EPIC", pct: 12 },
  { id: 3, label: "LEGENDARY", pct: 3 },
] as const;

export type RarityId = (typeof RARITY_WEIGHTS)[number]["id"];

export function rarityLabel(id: number): string {
  const row = RARITY_WEIGHTS.find((r) => r.id === id);
  return row?.label ?? "UNKNOWN";
}
