import { Link } from "react-router-dom";
import { Header } from "../components/bits";
import { problemsForTopic, topics, problems as allProblems } from "../lib/content";
import { useProgress } from "../state/ProgressContext";
import { useState } from "react";
import { resetProgress, rubricScore } from "../lib/storage";
import { useNavigate } from "react-router-dom";

export default function ProgressPage() {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const attempted = allProblems.filter((p) => {
    const pp = progress[p.id];
    return pp && (pp.viewed || Object.values(pp.steps ?? {}).some((s) => s.viewed || s.peeked));
  }).length;

  const scores: number[] = [];
  for (const p of allProblems) {
    const s = rubricScore(progress, p.id, p.steps.length);
    if (s && s.total > 0) scores.push(s.checked / s.total);
  }
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 pb-16">
      <Header variant="centered" />

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-6">Progress</h1>
      <p className="muted text-xl mt-3">
        {attempted} of {allProblems.length} problems attempted
        {avg !== null ? ` · average self-check score ${avg}%` : ""}
      </p>

      <div className="card mt-8 divide-y" style={{ borderColor: "var(--border)" }}>
        {topics.map((t) => {
          const list = problemsForTopic(t.id);
          const done = list.filter((p) => {
            const pp = progress[p.id];
            return pp && (pp.viewed || Object.values(pp.steps ?? {}).some((s) => s.viewed || s.peeked));
          }).length;
          return (
            <div key={t.id} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{t.name}</span>
                <span className="muted text-[15px]">
                  {done} of {list.length}
                </span>
              </div>
              <div className="bar-track mt-2" role="img" aria-label={`${t.name}: ${done} of ${list.length} done`}>
                <div className="bar-fill" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold">Combined problems</span>
            <span className="muted text-[15px]">
              {problemsForTopic("combined").filter((p) => {
                const pp = progress[p.id];
                return pp && (pp.viewed || Object.values(pp.steps ?? {}).some((s) => s.viewed || s.peeked));
              }).length}{" "}
              of {problemsForTopic("combined").length}
            </span>
          </div>
          <div className="bar-track mt-2" role="img" aria-label="Combined problems progress">
            <div
              className="bar-fill"
              style={{
                width: `${(problemsForTopic("combined").filter((p) => {
                  const pp = progress[p.id];
                  return pp && (pp.viewed || Object.values(pp.steps ?? {}).some((s) => s.viewed || s.peeked));
                }).length /
                  problemsForTopic("combined").length) *
                  100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary" onClick={() => setConfirming(true)}>
          Reset progress
        </button>
        <Link to="/" className="btn-primary">
          Back home
        </Link>
      </div>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="card p-6 max-w-md w-full">
            <h2 id="reset-title" className="text-xl font-bold mb-2">
              Reset all progress?
            </h2>
            <p className="muted text-[15px] mb-6">
              This clears every answer, rubric score and completion mark on this device. It cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" style={{ padding: "10px 20px" }} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "10px 20px" }}
                onClick={() => {
                  resetProgress();
                  setConfirming(false);
                  navigate(0);
                }}
              >
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
