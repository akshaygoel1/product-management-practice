import { describe, it, expect } from "vitest";
import { emptyScoping, evaluateScoping, maxStage, scopingStageValid } from "../src/lib/scoping";
import type { ScopingAmbiguity, ScopingData, ScopingKeyTerm } from "../src/lib/types";

const data = (patch: Partial<ScopingData>): ScopingData => ({ ...emptyScoping(), ...patch });
const amb = (term: string, why: string, clarification = "", assumption = false): ScopingAmbiguity => ({
  term,
  why,
  clarification,
  assumption,
});

const KEY_TERMS: ScopingKeyTerm[] = [
  { term: "retention", why: "7-day, 30-day or annual?" },
  { term: "customers", why: "all or a segment?" },
  { term: "improve", why: "by how much?" },
];

describe("scoping stage gating", () => {
  it("starts at stage 0 with no statement", () => {
    expect(maxStage(data({}))).toBe(0);
    expect(scopingStageValid(data({}), 0)).toBe(true);
    expect(scopingStageValid(data({}), 1)).toBe(false);
  });

  it("unlocks ambiguities once the statement is written", () => {
    expect(maxStage(data({ statement: "Retention is falling for paid users" }))).toBe(1);
  });

  it("unlocks scope only when every ambiguity has a term and a reason", () => {
    const s = "Retention is falling for paid users";
    expect(maxStage(data({ statement: s, ambiguities: [amb("Retention", "")] }))).toBe(1);
    expect(maxStage(data({ statement: s, ambiguities: [amb("Retention", "7-day or 30-day?")] }))).toBe(2);
  });

  it("unlocks review only when clarifications and the revision exist", () => {
    const s = "Retention is falling for paid users";
    const base = { statement: s, ambiguities: [amb("Retention", "7-day or 30-day?")] };
    expect(maxStage(data(base))).toBe(2);
    expect(maxStage(data({ ...base, finalStatement: "Monthly paid churn has reached 12%" }))).toBe(2);
    expect(
      maxStage(
        data({
          ...base,
          ambiguities: [amb("Retention", "7-day or 30-day?", "Monthly paid churn", false)],
          finalStatement: "Monthly paid churn has reached 12% and needs a target",
        })
      )
    ).toBe(3);
  });

  it("accepts an explicit assumption in place of a clarification", () => {
    expect(
      scopingStageValid(
        data({
          statement: "Retention is falling for paid users",
          ambiguities: [amb("Retention", "7-day or 30-day?", "", true)],
          finalStatement: "Monthly paid churn has reached 12%",
        }),
        3
      )
    ).toBe(true);
  });
});

describe("evaluateScoping", () => {
  it("praises statements that name who and a measurable outcome", () => {
    const f = evaluateScoping(
      data({ statement: "QuickKart support costs are rising because customers file avoidable queries" }),
      KEY_TERMS
    );
    expect(f.well.join(" ")).toContain("names who is affected");
    expect(f.well.join(" ")).toContain("measurable outcome");
    expect(f.missed.join(" ")).not.toContain("does not name");
  });

  it("flags missing users and outcomes without failing the user", () => {
    const f = evaluateScoping(data({ statement: "Improve the experience." }), []);
    expect(f.missed.join(" ")).toContain("who");
    expect(f.missed.join(" ")).toContain("measurable outcome");
  });

  it("nudges solution-styled statements", () => {
    const f = evaluateScoping(data({ statement: "We should build a loyalty program to improve retention" }), []);
    expect(f.improve.join(" ")).toContain("solution");
  });

  it("lists missed key terms the user did not flag", () => {
    const f = evaluateScoping(
      data({
        statement: "Retention is falling for paid users",
        ambiguities: [amb("Retention", "7-day or 30-day?"), amb("paid", "who counts as paid?")],
      }),
      KEY_TERMS
    );
    const missed = f.missed.join(" ");
    expect(missed).toContain("improve");
    expect(missed).not.toContain("retention");
  });

  it("never penalises explicitly-marked assumptions", () => {
    const f = evaluateScoping(
      data({
        statement: "Retention is falling for paid users",
        ambiguities: [amb("Retention", "7-day or 30-day?", "", true), amb("paid", "who counts?", "", true)],
        finalStatement: "Monthly paid churn has reached 12% for individual subscribers",
      }),
      KEY_TERMS
    );
    expect(f.well.join(" ")).toContain("explicitly marked assumptions");
    expect(f.missed.join(" ")).not.toContain("neither a clarification");
  });

  it("pushes the user when the revision repeats the original", () => {
    const f = evaluateScoping(
      data({
        statement: "Retention is falling for paid users",
        ambiguities: [amb("Retention", "7-day or 30-day?", "Monthly paid churn")],
        finalStatement: "Retention is falling for paid users",
      }),
      []
    );
    expect(f.improve.join(" ")).toContain("revision matches the original");
  });
});
