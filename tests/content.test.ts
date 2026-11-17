import { describe, it, expect } from "vitest";
import { problems, topics, problemsForTopic } from "../src/lib/content";
import { hasAnswer } from "../src/lib/storage";

describe("content", () => {
  it("has 51 problems: 39 single + 12 combined", () => {
    expect(problems.length).toBe(51);
    expect(problems.filter((p) => p.type === "single").length).toBe(39);
    expect(problems.filter((p) => p.type === "combined").length).toBe(12);
  });

  it("has 13 topics with 3 problems each", () => {
    expect(topics.length).toBe(13);
    for (const t of topics) {
      expect(problemsForTopic(t.id).length).toBe(3);
    }
  });

  it("every problem has hints and a 3+ item rubric", () => {
    for (const p of problems) {
      for (const s of p.steps) {
        expect(s.hints.length).toBeGreaterThanOrEqual(1);
        expect(s.reference.rubric.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("combined problems have 2 to 4 steps", () => {
    for (const p of problems.filter((x) => x.type === "combined")) {
      expect(p.steps.length).toBeGreaterThanOrEqual(2);
      expect(p.steps.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("hasAnswer", () => {
  it("detects any typed value in nested structures", () => {
    expect(hasAnswer(null)).toBe(false);
    expect(hasAnswer({ root: "", children: [] })).toBe(false);
    expect(hasAnswer({ root: "GMV", children: [] })).toBe(true);
    expect(hasAnswer({ edges: [{ cause: "", effect: "x", sign: "+" }] })).toBe(true);
    expect(hasAnswer({ edges: [{ cause: "", effect: "", sign: "+" }], loops: "" })).toBe(false);
  });
});
