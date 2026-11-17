import { Link } from "react-router-dom";
import { Header } from "../components/bits";
import { problemsForTopic, topics } from "../lib/content";
import { useProgress } from "../state/ProgressContext";
import { useDifficulty } from "../state/DifficultyContext";

function doneCount(topicId: string, viewedIds: Set<string>): number {
  return problemsForTopic(topicId).filter((p) => viewedIds.has(p.id)).length;
}

export default function Topics() {
  const { completedIds } = useProgress();
  const { difficulty } = useDifficulty();
  const count = (id: string) =>
    difficulty === "any" ? problemsForTopic(id).length : problemsForTopic(id).filter((p) => p.difficulty === difficulty).length;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <Header variant="centered" />

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-6">Choose a topic</h1>
      <p className="muted text-xl mt-3">Pick one skill, or try a combined problem that chains several.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
        {topics.map((t) => {
          const n = count(t.id);
          const done = doneCount(t.id, completedIds);
          return (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              className="card p-5 hover:border-[var(--muted)] transition-colors"
              aria-label={`${t.name}, ${n} problems${done > 0 ? `, ${done} done` : ""}`}
            >
              <div className="font-semibold text-[17px]">{t.name}</div>
              <div className="muted text-[15px] mt-1">
                {n} problems{done > 0 ? ` · ${done} done` : ""}
              </div>
            </Link>
          );
        })}

        <Link
          to="/topics/combined"
          className="p-5 rounded-2xl transition-opacity hover:opacity-90"
          style={{ background: "var(--chip-active)", color: "var(--chip-active-text)" }}
          aria-label="Combined problems, 12 problems, chain 2 to 4 skills"
        >
          <div className="font-semibold text-[17px]">Combined problems</div>
          <div className="text-[15px] mt-1 opacity-80">
            {count("combined")} problems · chain 2 to 4 skills
          </div>
        </Link>
      </div>
    </main>
  );
}
