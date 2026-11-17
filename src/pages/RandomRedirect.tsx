import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { problems } from "../lib/content";
import { pickNext } from "../lib/random";
import { useProgress } from "../state/ProgressContext";
import { useDifficulty } from "../state/DifficultyContext";

export default function RandomRedirect() {
  const navigate = useNavigate();
  const { completedIds } = useProgress();
  const { difficulty } = useDifficulty();
  const [params] = useSearchParams();
  const exclude = params.get("exclude") ?? undefined;

  useEffect(() => {
    const next = pickNext(problems, completedIds, difficulty, exclude);
    if (next) navigate(`/problem/${next.id}?v=r`, { replace: true });
    else navigate("/", { replace: true });
  }, [completedIds, difficulty, exclude, navigate]);

  return null;
}
