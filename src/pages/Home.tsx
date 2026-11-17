import { Link } from "react-router-dom";
import { Header, DifficultyChips } from "../components/bits";
import { problems } from "../lib/content";
import { useProgress } from "../state/ProgressContext";
import { useDifficulty } from "../state/DifficultyContext";
import { pickNext } from "../lib/random";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { progress } = useProgress();
  const { difficulty } = useDifficulty();
  const navigate = useNavigate();
  const attempted = Object.keys(progress).length;

  const goRandom = () => {
    const next = pickNext(problems, new Set(), difficulty);
    if (next) navigate(`/problem/${next.id}?v=r`);
  };

  return (
    <main className="mx-auto max-w-6xl min-h-[100dvh] px-6 pb-10 flex flex-col">
      <Header variant="home" />

      <div className="flex-1 flex flex-col justify-center py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl">
          Practice product thinking.
        </h1>
        <p className="muted text-xl sm:text-2xl mt-4 max-w-2xl">
          {problems.length} realistic problems. Work it out your way, then unfold the reference answer to compare.
        </p>

        <div className="flex flex-wrap gap-4 mt-10">
          <button type="button" className="btn-primary text-lg" onClick={goRandom}>
            Random problem
          </button>
          <Link to="/topics" className="btn-secondary text-lg">
            Choose a topic
          </Link>
        </div>

        <div className="mt-10">
          <DifficultyChips />
        </div>
      </div>

      <footer className="pb-4">
        <div className="flex items-center gap-4">
          <div className="bar-track flex-1" role="img" aria-label={`Progress bar: ${attempted} of ${problems.length} problems attempted`}>
            <div className="bar-fill" style={{ width: `${(attempted / problems.length) * 100}%` }} />
          </div>
          <span className="muted text-[15px] whitespace-nowrap">
            {attempted} of {problems.length} attempted
          </span>
        </div>
      </footer>
    </main>
  );
}
