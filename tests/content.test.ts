import { describe, it, expect } from "vitest";
import { problems, topics, problemsForTopic } from "../src/lib/content";
import { hasAnswer } from "../src/lib/storage";

describe("content", () => {
  it("has 63 problems: 51 single + 12 combined", () => {
    expect(problems.length).toBe(63);
    expect(problems.filter((p) => p.type === "single").length).toBe(51);
    expect(problems.filter((p) => p.type === "combined").length).toBe(12);
  });

  it("has 14 topics; skill topics have 3 problems each, Case Hours has 12", () => {
    expect(topics.length).toBe(14);
    for (const t of topics) {
      const expected = t.id === "case-hours" ? 12 : 3;
      expect(problemsForTopic(t.id).length).toBe(expected);
    }
  });

  it("case-hours problems are well-formed business cases", () => {
    const cases = problemsForTopic("case-hours");
    expect(cases.length).toBe(12);
    for (const p of cases) {
      expect(p.type).toBe("single");
      expect(p.id).toMatch(/^case-\d{2}$/);
      expect(p.steps.length).toBe(1);
      const s = p.steps[0];
      expect(s.answerSchema).toBe("case-analysis");
      expect(s.taskPoints!.length).toBeGreaterThanOrEqual(5);
      expect(s.worksheet!.length).toBe(s.taskPoints!.length);
      expect(s.reference.rubric).toEqual(s.deliverables);
      const c = s.reference.content as { sections?: unknown[] };
      expect(c.sections!.length).toBeGreaterThanOrEqual(4);
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
    expect(hasAnswer({ answers: ["", ""] })).toBe(false);
    expect(hasAnswer({ answers: ["", "Some analysis"] })).toBe(true);
  });
});
