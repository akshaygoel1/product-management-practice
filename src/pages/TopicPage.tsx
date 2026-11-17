import { Link, useParams } from "react-router-dom";
import { Header } from "../components/bits";
import { getProblem, problemsForTopic, topicById } from "../lib/content";
import { useProgress } from "../state/ProgressContext";
import { useDifficulty } from "../state/DifficultyContext";
import { pickNext } from "../lib/random";
import { useNavigate } from "react-router-dom";

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { completedIds } = useProgress();
  const { difficulty } = useDifficulty();

  const topic = topicId === "combined" ? undefined : topicById(topicId ?? "");
  const problems = problemsForTopic(topicId ?? "").filter(
    (p) => difficulty === "any" || p.difficulty === difficulty
  );
  const allForTopic = problemsForTopic(topicId ?? "");

  if (!topic && topicId !== "combined") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
          <Link to="/topics" className="btn-primary">Back to topics</Link>
        </div>
      </main>
    );
  }

  const name = topicId === "combined" ? "Combined problems" : topic!.name;
  const description =
    topicId === "combined"
      ? "Multi-skill problems. Each step has its own task and hidden reference answer."
      : topic!.description;

  const surprise = () => {
    const next = pickNext(allForTopic, new Set(), difficulty);
    if (next) navigate(`/problem/${next.id}`);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <Header variant="centered" />

      <div className="flex flex-wrap items-end gap-4 mt-6">
        <div className="flex-1 min-w-64">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{name}</h1>
          <p className="muted text-xl mt-3 max-w-2xl">{description}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={surprise} disabled={problems.length === 0}>
          Surprise me
        </button>
      </div>

      {problems.length === 0 ? (
        <div className="card p-8 mt-8 text-center">
          <p className="muted">No problems at this difficulty in this topic. Try another difficulty.</p>
        </div>
      ) : (
        <ul className="grid gap-3 mt-8" style={{ listStyle: "none" }}>
          {problems.map((p) => {
            const done = completedIds.has(p.id);
            return (
              <li key={p.id}>
                <Link to={`/problem/${p.id}`} className="card p-5 flex items-center gap-4 hover:border-[var(--muted)] transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-[17px]">
                      {p.title}
                      {p.type === "combined" && (
                        <span className="muted font-normal text-[14px] ml-2">
                          {p.steps.map((s) => topicName(s.topic)).join(" → ")}
                        </span>
                      )}
                    </div>
                    <div className="muted text-[15px] mt-0.5 capitalize">
                      {p.difficulty} · {p.estimatedMinutes} min
                    </div>
                  </div>
                  {done && (
                    <span className="tick font-semibold text-[15px]" aria-label="Done">
                      ✓ Done
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="muted text-[15px] mt-8">
        <Link to="/topics" className="link">← All topics</Link>
      </p>
    </main>
  );
}

// topicName used in combined titles
function topicName(id: string): string {
  return topicById(id)?.name ?? id;
}
