import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadDifficulty, saveDifficulty } from "../lib/storage";

type Filter = "any" | "easy" | "medium" | "hard";

const DifficultyContext = createContext<{ difficulty: Filter; setDifficulty: (d: Filter) => void } | null>(null);

export function DifficultyProvider({ children }: { children: ReactNode }) {
  const [difficulty, set] = useState<Filter>(() => loadDifficulty());

  useEffect(() => {
    saveDifficulty(difficulty);
  }, [difficulty]);

  const setDifficulty = useCallback((d: Filter) => set(d), []);
  const value = useMemo(() => ({ difficulty, setDifficulty }), [difficulty, setDifficulty]);
  return <DifficultyContext.Provider value={value}>{children}</DifficultyContext.Provider>;
}

export function useDifficulty() {
  const ctx = useContext(DifficultyContext);
  if (!ctx) throw new Error("useDifficulty outside provider");
  return ctx;
}
