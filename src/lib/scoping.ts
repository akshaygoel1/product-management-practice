import type { ScopingData, ScopingKeyTerm } from "./types";

/* ============================================================
   Problem Scoping (Case Hours): persistence, stage gating and
   rubric-based evaluation. Evaluation judges the quality of the
   reasoning — never exact wording — and never penalises
   explicitly-marked assumptions.
   ============================================================ */

export const RUBRIC_ITEMS = [
  "The problem statement clearly identifies the core problem.",
  "The ambiguities I identified are genuinely unclear terms or assumptions.",
  "Each ambiguity has a reasonable clarification or an explicit assumption.",
  "My final problem statement is specific, focused and actionable.",
];

export const GOOD_STATEMENT_HINT =
  "A good problem statement names who is affected, what is going wrong and the outcome it hurts — one sentence, without prescribing a solution.";

const scopingKey = (problemId: string) => `pmps:scoping:${problemId}`;

export function emptyScoping(): ScopingData {
  return { statement: "", ambiguities: [], finalStatement: "", rubric: RUBRIC_ITEMS.map(() => false), completedAt: null };
}

export function loadScoping(problemId: string): ScopingData | null {
  try {
    const raw = localStorage.getItem(scopingKey(problemId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScopingData;
    if (!parsed || typeof parsed !== "object") return null;
    return { ...emptyScoping(), ...parsed, rubric: RUBRIC_ITEMS.map((_, i) => !!parsed.rubric?.[i]) };
  } catch {
    return null;
  }
}

export function saveScoping(problemId: string, data: ScopingData) {
  try {
    localStorage.setItem(scopingKey(problemId), JSON.stringify(data));
  } catch {
    /* storage full or blocked — scoping stays in memory only */
  }
}

/* stages: 0 = statement, 1 = ambiguities, 2 = scope, 3 = review */

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function scopingStageValid(d: ScopingData, stage: number): boolean {
  if (stage >= 1 && wordCount(d.statement) < 4) return false;
  if (stage >= 2) {
    if (d.ambiguities.length === 0) return false;
    if (!d.ambiguities.every((a) => a.term.trim() && wordCount(a.why) >= 2)) return false;
  }
  if (stage >= 3) {
    if (!d.ambiguities.every((a) => a.clarification.trim().length > 0 || a.assumption)) return false;
    if (wordCount(d.finalStatement) < 4) return false;
  }
  return true;
}

/** Highest stage the user can currently be on. */
export function maxStage(d: ScopingData): number {
  let m = 0;
  if (scopingStageValid(d, 1)) m = 1;
  if (scopingStageValid(d, 2)) m = 2;
  if (scopingStageValid(d, 3)) m = 3;
  return m;
}

/* ---------- evaluation (deterministic, rubric-based) ---------- */

export interface ScopingFeedback {
  well: string[];
  missed: string[];
  improve: string[];
}

const WHO =
  /\b(user|users|customer|customers|driver|drivers|agent|agents|student|students|tutor|tutors|seller|sellers|buyer|buyers|rider|riders|passenger|passengers|subscriber|subscribers|organisation|organisations|organization|organizations|business|businesses|merchant|merchants|segment|segments|professional|professionals|squad|squads|team|teams)\b/i;
const OUTCOME =
  /\b(retention|conversion|churn|revenue|cost|costs|satisfaction|csat|bookings|rides|queries|ltv|margin|uptime|accuracy|adoption|utilisation|utilization|fulfilment|fulfillment|gmv|profit|profitab|engagement|repeat|support)\b/i;
const SOLUTION = /\bwe (should|need to|must) (add|build|launch|create|implement|introduce|remove)\b/i;

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9₹% ]/g, " ").replace(/\s+/g, " ").trim();

function termMatches(entry: string, keyTerm: string): boolean {
  const t = norm(entry);
  const k = norm(keyTerm);
  if (!t || !k) return false;
  if (k.includes(t) || t.includes(k)) return true;
  return t.split(" ").some((w) => w.length > 3 && k.includes(w));
}

export function evaluateScoping(d: ScopingData, keyTerms: ScopingKeyTerm[]): ScopingFeedback {
  const well: string[] = [];
  const missed: string[] = [];
  const improve: string[] = [];

  /* Step 1 — problem statement */
  if (wordCount(d.statement) >= 4) well.push("You wrote a one-line problem statement before jumping to solutions.");
  if (WHO.test(d.statement) && wordCount(d.statement) >= 6) well.push("The statement names who is affected.");
  else if (wordCount(d.statement) < 6) missed.push("The statement is short — say who experiences the problem and what outcome it hurts.");
  else missed.push("The statement does not name who experiences the problem (users, drivers, agents…).");
  if (OUTCOME.test(d.statement)) well.push("It anchors the problem to a measurable outcome.");
  else missed.push("Anchor the statement to a measurable outcome (retention, cost per order, completed bookings…).");
  if (SOLUTION.test(d.statement)) improve.push("Your statement reads like a solution — reframe it as the problem to solve.");
  if (wordCount(d.statement) > 45) improve.push("The statement is long — aim for one tight sentence.");

  /* Step 2 — ambiguities */
  if (d.ambiguities.length >= 2) well.push(`You flagged ${d.ambiguities.length} ambiguities in your own statement.`);
  else improve.push("Push further — most case statements hide two to four ambiguous terms.");
  const withWhy = d.ambiguities.filter((a) => wordCount(a.why) >= 3).length;
  if (d.ambiguities.length > 0 && withWhy === d.ambiguities.length) {
    well.push("Each ambiguity explains why it is unclear, not just that it is.");
  } else {
    improve.push("Explain why each flagged term is ambiguous — what could it mean, and for whom?");
  }
  const matched = keyTerms.map((kt) => d.ambiguities.some((a) => termMatches(a.term, kt.term)));
  const unmatched = keyTerms.filter((_, i) => !matched[i]);
  if (keyTerms.length > 0 && unmatched.length === 0) {
    well.push("You caught the ambiguities this case is really about.");
  } else if (unmatched.length > 0) {
    missed.push(
      `Also unclear in this case: ${unmatched.slice(0, 2).map((k) => `“${k.term}”`).join(", ")}${unmatched.length > 2 ? ` (+${unmatched.length - 2} more)` : ""}.`
    );
  }

  /* Step 3 — clarifications and revision */
  const assumptions = d.ambiguities.filter((a) => a.assumption);
  const clarified = d.ambiguities.filter((a) => a.clarification.trim() && !a.assumption).length;
  if (clarified > 0) {
    well.push(`You clarified ${clarified} ambiguities${assumptions.length ? ` and marked ${assumptions.length} as assumptions` : ""}.`);
  }
  if (assumptions.length > 0) {
    well.push("You explicitly marked assumptions instead of inventing facts — exactly right when the case data is silent.");
  }
  const unresolved = d.ambiguities.filter((a) => !a.clarification.trim() && !a.assumption).length;
  if (unresolved > 0) missed.push(`${unresolved} ambiguit${unresolved === 1 ? "y has" : "ies have"} neither a clarification nor an assumption.`);

  /* Final statement */
  if (wordCount(d.finalStatement) >= 8) well.push("The revised statement is specific enough to act on.");
  else improve.push("Make the revised statement more specific — who, what problem, what outcome, what scope.");
  if (norm(d.statement) === norm(d.finalStatement)) {
    improve.push("The revision matches the original — use Step 3 to add the scope you clarified.");
  } else {
    well.push("The revision sharpens the original rather than repeating it.");
  }
  if (/[\d₹%]/.test(d.finalStatement)) well.push("It includes a concrete number or constraint.");

  return { well, missed, improve };
}
