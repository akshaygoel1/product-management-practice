import type { Difficulty } from "./types";

/* localStorage keys, per PRD section 11 */
export const PROGRESS_KEY = "pmps:progress";
export const DIFFICULTY_KEY = "pmps:difficulty";
export const answersKey = (problemId: string, stepIndex: number) =>
  `pmps:answers:${problemId}:${stepIndex}`;

export interface StepProgress {
  viewed?: boolean;
  peeked?: boolean;
  rubric?: boolean[];
}
export interface ProblemProgress {
  viewed?: boolean;
  steps: Record<string, StepProgress>;
  updatedAt: number;
}
export type Progress = Record<string, ProblemProgress>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — answers stay in memory only */
  }
}

export function loadProgress(): Progress {
  return readJson<Progress>(PROGRESS_KEY, {});
}

export function saveProgress(p: Progress) {
  writeJson(PROGRESS_KEY, p);
}

export function getProblemProgress(p: Progress, problemId: string): ProblemProgress {
  return p[problemId] ?? { steps: {}, updatedAt: 0 };
}

export function updateProblemProgress(
  p: Progress,
  problemId: string,
  fn: (pp: ProblemProgress) => ProblemProgress
): Progress {
  const current = getProblemProgress(p, problemId);
  const next = fn({ ...current, steps: { ...current.steps } });
  next.updatedAt = Date.now();
  const copy = { ...p, [problemId]: next };
  saveProgress(copy);
  return copy;
}

export function loadAnswer<T>(problemId: string, stepIndex: number): T | null {
  try {
    const raw = localStorage.getItem(answersKey(problemId, stepIndex));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveAnswer(problemId: string, stepIndex: number, data: unknown) {
  try {
    localStorage.setItem(answersKey(problemId, stepIndex), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function hasAnswer(data: unknown): boolean {
  if (data == null) return false;
  if (typeof data === "string") {
    // default sign-select values do not count as "typed something"
    if (data === "+" || data === "−") return false;
    return data.trim().length > 0;
  }
  if (Array.isArray(data)) return data.some(hasAnswer);
  if (typeof data === "object") {
    return Object.values(data as Record<string, unknown>).some(hasAnswer);
  }
  return false;
}

export function loadDifficulty(): Difficulty | "any" {
  const v = localStorage.getItem(DIFFICULTY_KEY);
  return v === "easy" || v === "medium" || v === "hard" ? v : "any";
}

export function saveDifficulty(d: Difficulty | "any") {
  try {
    if (d === "any") localStorage.removeItem(DIFFICULTY_KEY);
    else localStorage.setItem(DIFFICULTY_KEY, d);
  } catch {
    /* ignore */
  }
}

/** Problems with any recorded activity (typed something or opened the reference). */
export function attemptedCount(progress: Progress): number {
  return Object.keys(progress).filter((id) => {
    const pp = progress[id];
    if (!pp) return false;
    if (pp.viewed) return true;
    return Object.values(pp.steps ?? {}).some((s) => s.viewed || s.peeked);
  }).length;
}

export function resetProgress(): Progress {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("pmps:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  return {};
}

export function rubricScore(progress: Progress, problemId: string, stepCount: number): { checked: number; total: number } | null {
  const pp = progress[problemId];
  if (!pp) return null;
  let checked = 0;
  let total = 0;
  let any = false;
  for (let i = 0; i < stepCount; i++) {
    const sp = pp.steps?.[String(i)];
    const items = sp?.rubric;
    if (items && items.length > 0) any = true;
    for (let j = 0; j < (items?.length ?? 0); j++) {
      total++;
      if (items![j]) checked++;
    }
  }
  return any ? { checked, total } : null;
}
