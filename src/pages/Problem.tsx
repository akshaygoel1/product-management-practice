import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { getProblem, topicName, topicById, problems } from "../lib/content";
import type { AnswerData, Problem, SchemaId, Step } from "../lib/types";
import { hasAnswer, loadAnswer, saveAnswer } from "../lib/storage";
import { useProgress } from "../state/ProgressContext";
import { pickNext } from "../lib/random";
import { useDifficulty } from "../state/DifficultyContext";
import { Breadcrumb, Hints, Rubric } from "../components/bits";
import { AnswerEditor } from "../components/editors";
import { ReferenceView, AnswerSummary } from "../components/renderers";

function ReferenceCard({
  problemId,
  stepIndex,
  step,
  answer,
}: {
  problemId: string;
  stepIndex: number;
  step: Step;
  answer: AnswerData | null;
}) {
  const { get, markViewed, markPeeked, setRubric } = useProgress();
  const sp = get(problemId).steps[String(stepIndex)];
  const [open, setOpen] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);
  const answered = hasAnswer(answer);
  const peeked = !!sp?.peeked;
  const canOpen = answered || peeked;

  const toggle = () => {
    if (!open) {
      setOpen(true);
      markViewed(problemId, stepIndex);
      if (!answered) markPeeked(problemId, stepIndex);
    } else {
      setOpen(false);
    }
  };

  const rubricItems = step.reference.rubric;
  const checked = useMemo(() => {
    const saved = sp?.rubric;
    return rubricItems.map((_, i) => !!saved?.[i]);
  }, [sp?.rubric, rubricItems]);

  return (
    <section className={open ? "card-tint" : "card"} aria-live="polite">
      <div className="flex flex-wrap items-center gap-3 p-5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}
        >
          <path d="M5 3l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-semibold">Reference answer</span>
        {!open && <span className="muted text-[15px]">Hidden until you open it</span>}
        <span className="flex-1" />
        {!open ? (
          <span className="flex flex-wrap items-center gap-2">
            {!canOpen && (
              <button
                type="button"
                className="text-[14px] link"
                onClick={() => {
                  setOpen(true);
                  markViewed(problemId, stepIndex);
                  markPeeked(problemId, stepIndex);
                }}
              >
                I'll just peek
              </button>
            )}
            <button type="button" className="btn-primary" style={{ padding: "10px 20px" }} disabled={!canOpen} onClick={toggle}>
              Show reference answer
            </button>
          </span>
        ) : (
          <button type="button" className="btn-small" onClick={toggle} aria-expanded="true">
            Hide
          </button>
        )}
      </div>
      {open && (
        <div className="px-5 pb-5">
          <div className={sideBySide ? "grid gap-5 md:grid-cols-2" : ""}>
            {sideBySide && (
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="label mb-2">Your answer</div>
                <AnswerSummary schema={step.answerSchema} data={answer} />
              </div>
            )}
            <div>
              <ReferenceView schema={step.answerSchema} content={step.reference.content} />
            </div>
          </div>

          <div className="hidden md:flex mt-4">
            <button type="button" className="btn-small" aria-pressed={sideBySide} onClick={() => setSideBySide((s) => !s)}>
              {sideBySide ? "Stack view" : "Compare side by side"}
            </button>
          </div>

          {(step.reference.whyItWorks || (step.reference.commonMistakes?.length ?? 0) > 0) && (
            <div className="grid gap-5 md:grid-cols-2 mt-5">
              {step.reference.whyItWorks && (
                <div>
                  <div className="label mb-1">Why it works</div>
                  <p className="text-[15px]">{step.reference.whyItWorks}</p>
                </div>
              )}
              {(step.reference.commonMistakes?.length ?? 0) > 0 && (
                <div>
                  <div className="label mb-1">Common mistakes</div>
                  <p className="text-[15px]">{step.reference.commonMistakes!.join(" ")}</p>
                </div>
              )}
            </div>
          )}

          <Rubric items={rubricItems} checked={checked} onChange={(next) => setRubric(problemId, stepIndex, next)} />
        </div>
      )}
    </section>
  );
}

function StepBlock({
  problem,
  step,
  stepIndex,
  answer,
  onAnswerChange,
}: {
  problem: Problem;
  step: Step;
  stepIndex: number;
  answer: AnswerData | null;
  onAnswerChange: (v: AnswerData) => void;
}) {
  const { get } = useProgress();
  const prev = problem.steps[stepIndex - 1];
  const prevAnswered = prev ? hasAnswer(answerOf(problem.id, stepIndex - 1)) : true;
  const prevPeeked = !!get(problem.id).steps[String(stepIndex - 1)]?.peeked;
  const unlocked = stepIndex === 0 || prevAnswered || prevPeeked;
  const showRecap = step.showPreviousAnswer && stepIndex > 0 && unlocked;

  if (!unlocked) {
    return (
      <section className="card p-5">
        <div className="font-semibold mb-1">
          Step {stepIndex + 1} · {topicName(step.topic)}
        </div>
        <p className="muted text-[15px]">
          Finish step {stepIndex} — or open its reference with “I'll just peek” — to unlock this step.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {problem.type === "combined" && (
        <h2 className="text-xl font-bold">
          Step {stepIndex + 1} · {topicName(step.topic)}
        </h2>
      )}

      <section className="card-tint p-5">
        <div className="label-tint mb-2">Task</div>
        <p className="text-[17px]">{step.task}</p>
      </section>

      {showRecap && (
        <section className="card p-5">
          <div className="label mb-2">Your step {stepIndex} answer</div>
          <AnswerSummary schema={problem.steps[stepIndex - 1].answerSchema} data={answerOf(problem.id, stepIndex - 1)} />
        </section>
      )}

      <section className="card p-5">
        <div className="label mb-2">Your answer</div>
        <AnswerEditor schema={step.answerSchema} value={answer} onChange={onAnswerChange} />
        <p className="muted text-[13px] mt-3">Saved automatically on this device. Take your time — there's no single right answer.</p>
      </section>

      <Hints hints={step.hints} />

      <ReferenceCard problemId={problem.id} stepIndex={stepIndex} step={step} answer={answer} />
    </div>
  );
}

/* answer cache so recap can read earlier steps without prop-drilling */
const answerCache = new Map<string, (AnswerData | null)[]>();
function answerOf(problemId: string, stepIndex: number): AnswerData | null {
  const arr = answerCache.get(problemId);
  const found = arr?.[stepIndex];
  if (found !== undefined) return found;
  return loadAnswer<AnswerData>(problemId, stepIndex);
}

export default function Problem() {
  const { problemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { difficulty } = useDifficulty();
  const problem = getProblem(problemId);

  const [answers, setAnswers] = useState<(AnswerData | null)[]>([]);

  useEffect(() => {
    if (!problem) return;
    setAnswers(problem.steps.map((_, i) => loadAnswer<AnswerData>(problem.id, i)));
    answerCache.set(problem.id, problem.steps.map((_, i) => loadAnswer<AnswerData>(problem.id, i)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

  if (!problem) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Problem not found</h1>
          <p className="muted mb-6">The problem you're looking for doesn't exist.</p>
          <Link to="/" className="btn-primary">Back home</Link>
        </div>
      </main>
    );
  }

  const setAnswer = (stepIndex: number, v: AnswerData) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIndex] = v;
      answerCache.set(problem.id, next);
      return next;
    });
    saveAnswer(problem.id, stepIndex, v);
  };

  const topicLabel =
    problem.type === "single" ? topicName(problem.steps[0].topic) : "Combined problems";
  const backTo =
    problem.type === "single" ? `/topics/${problem.steps[0].topic}` : "/topics/combined";

  const nextRandom = () => {
    const next = pickNext(problems, new Set(), difficulty, problem.id);
    if (next) navigate(`/problem/${next.id}?v=r`);
  };

  const viaRandom = new URLSearchParams(location.search).get("v") === "r";

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="py-4">
        <Breadcrumb
          topicLabel={topicLabel}
          difficulty={problem.difficulty}
          minutes={problem.estimatedMinutes}
          backTo={backTo}
          right={
            <button type="button" className="link" onClick={nextRandom}>
              Skip
            </button>
          }
        />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-5">{problem.title}</h1>

      <section className="card p-5 mb-4">
        <div className="label mb-2">Scenario</div>
        <p className="text-[17px]">
          {problem.scenario.company ? (
            <>
              <strong>{problem.scenario.company}</strong>{" "}
            </>
          ) : null}
          {problem.scenario.context}
        </p>
      </section>

      <div className="space-y-4">
        {problem.steps.map((step, i) => (
          <StepBlock
            key={i}
            problem={problem}
            step={step}
            stepIndex={i}
            answer={answers[i] ?? null}
            onAnswerChange={(v) => setAnswer(i, v)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-8">
        <button type="button" className="btn-primary" onClick={nextRandom}>
          Next random problem
        </button>
        <Link to="/" className="btn-secondary">
          Back home
        </Link>
      </div>

      {viaRandom && (
        <p className="muted text-[13px] mt-4">Skipped problems are not marked as attempted.</p>
      )}
    </main>
  );
}
