import { describe, it, expect } from "vitest";
import { pickNext, type PickableProblem } from "../src/lib/random";

const items: PickableProblem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i + 1}`,
  difficulty: i < 2 ? ("easy" as const) : i < 4 ? ("medium" as const) : ("hard" as const),
}));

/** deterministic rng that cycles 0, .2, .4, .6, .8 */
function cycleRng() {
  let n = 0;
  return () => {
    const v = (n % 5) / 5;
    n++;
    return v;
  };
}

describe("pickNext", () => {
  it("excludes completed problems until all are done, then resets", () => {
    const completed = new Set<string>();
    const seen = new Set<string>();
    // walk until every problem completed; before exhaustion, never repeat
    for (let i = 0; i < items.length; i++) {
      const next = pickNext(items, completed, "any", undefined, cycleRng())!;
      expect(completed.has(next.id)).toBe(false);
      seen.add(next.id);
      completed.add(next.id);
    }
    expect(seen.size).toBe(items.length);
    // pool exhausted → resets and can return an already-completed one
    const after = pickNext(items, completed, "any", undefined, cycleRng())!;
    expect(after).toBeDefined();
  });

  it("respects the difficulty filter", () => {
    for (let i = 0; i < 20; i++) {
      const next = pickNext(items, new Set(), "easy", undefined, cycleRng())!;
      expect(["p1", "p2"]).toContain(next.id);
    }
  });

  it("excludes the excluded id", () => {
    for (let i = 0; i < 20; i++) {
      const next = pickNext(items, new Set(), "any", "p1", cycleRng())!;
      expect(next.id).not.toBe("p1");
    }
  });

  it("returns null only when there is nothing to pick", () => {
    expect(pickNext([], new Set())).toBeNull();
  });
});
