import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { loadProgress, updateProblemProgress, type Progress, type ProblemProgress, type StepProgress } from "../lib/storage";

interface Ctx {
  progress: Progress;
  get: (problemId: string) => ProblemProgress;
  setStep: (problemId: string, stepIndex: number, fn: (sp: StepProgress) => StepProgress) => void;
  markViewed: (problemId: string, stepIndex: number) => void;
  markPeeked: (problemId: string, stepIndex: number) => void;
  setRubric: (problemId: string, stepIndex: number, checked: boolean[]) => void;
  completedIds: Set<string>;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  const get = useCallback(
    (problemId: string) => progress[problemId] ?? { steps: {}, updatedAt: 0 },
    [progress]
  );

  const setStep = useCallback(
    (problemId: string, stepIndex: number, fn: (sp: StepProgress) => StepProgress) => {
      setProgress((p) =>
        updateProblemProgress(p, problemId, (pp) => {
          const cur = pp.steps[String(stepIndex)] ?? {};
          return { ...pp, steps: { ...pp.steps, [String(stepIndex)]: fn(cur) } };
        })
      );
    },
    []
  );

  const markViewed = useCallback(
    (problemId: string, stepIndex: number) => {
      setProgress((p) =>
        updateProblemProgress(p, problemId, (pp) => ({
          ...pp,
          viewed: true,
          steps: { ...pp.steps, [String(stepIndex)]: { ...(pp.steps[String(stepIndex)] ?? {}), viewed: true } },
        }))
      );
    },
    []
  );

  const markPeeked = useCallback(
    (problemId: string, stepIndex: number) => {
      setStep(problemId, stepIndex, (sp) => ({ ...sp, peeked: true }));
    },
    [setStep]
  );

  const setRubric = useCallback(
    (problemId: string, stepIndex: number, checked: boolean[]) => {
      setStep(problemId, stepIndex, (sp) => ({ ...sp, rubric: checked }));
    },
    [setStep]
  );

  const completedIds = useMemo(() => {
    const s = new Set<string>();
    for (const [id, pp] of Object.entries(progress)) {
      if (pp?.viewed || Object.values(pp?.steps ?? {}).some((sp) => sp.viewed)) s.add(id);
    }
    return s;
  }, [progress]);

  const value = useMemo(
    () => ({ progress, get, setStep, markViewed, markPeeked, setRubric, completedIds }),
    [progress, get, setStep, markViewed, markPeeked, setRubric, completedIds]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
