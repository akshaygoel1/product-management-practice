/**
 * Random problem selection: picks uniformly from problems, excluding
 * already-completed ones until all are done, then resets. Respects the
 * difficulty filter.
 */
export type DifficultyFilter = "any" | "easy" | "medium" | "hard";

export interface PickableProblem {
  id: string;
  difficulty: "easy" | "medium" | "hard";
}

export function pickRandom<T>(items: T[], rng: () => number = Math.random): T {
  if (items.length === 0) throw new Error("pickRandom on empty list");
  return items[Math.floor(rng() * items.length)];
}

export function pickNext<P extends PickableProblem>(
  all: P[],
  completedIds: ReadonlySet<string>,
  difficulty: DifficultyFilter = "any",
  excludeId?: string,
  rng: () => number = Math.random
): P | null {
  if (all.length === 0) return null;
  let pool = all.filter((p) => p.id !== excludeId);
  if (pool.length === 0) return null;
  if (difficulty !== "any") {
    const filtered = pool.filter((p) => p.difficulty === difficulty);
    if (filtered.length > 0) pool = filtered;
  }
  const uncompleted = pool.filter((p) => !completedIds.has(p.id));
  if (uncompleted.length > 0) return pickRandom(uncompleted, rng);
  // every problem in the pool is completed → reset within the pool
  return pickRandom(pool, rng);
}
