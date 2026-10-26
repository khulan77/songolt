import type { PrisonKey } from "./content";

/**
 * Хамгийн олон сонгогдсон түлхүүр хожно.
 * Тэнцвэл тэнцсэн түлхүүрүүдээс хамгийн сүүлд сонгогдсон нь хожно.
 */
export function scoreAnswers(answers: PrisonKey[]): PrisonKey | null {
  if (answers.length === 0) return null;

  const counts = new Map<PrisonKey, number>();
  const lastIndex = new Map<PrisonKey, number>();
  answers.forEach((key, i) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    lastIndex.set(key, i);
  });

  let best: PrisonKey | null = null;
  for (const [key, count] of counts) {
    if (best === null) {
      best = key;
      continue;
    }
    const bestCount = counts.get(best)!;
    if (
      count > bestCount ||
      (count === bestCount && lastIndex.get(key)! > lastIndex.get(best)!)
    ) {
      best = key;
    }
  }
  return best;
}
