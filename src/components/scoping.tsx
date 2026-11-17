import { useState } from "react";
import type { ScopingAmbiguity, ScopingData, ScopingReference } from "../lib/types";
import {
  GOOD_STATEMENT_HINT,
  RUBRIC_ITEMS,
  emptyScoping,
  evaluateScoping,
  loadScoping,
  maxStage,
  saveScoping,
  scopingStageValid,
} from "../lib/scoping";

/* ============================================================
   Problem Scoping wizard (Case Hours only).
   Guided, three-step flow: statement → ambiguities → scope,
   then a review summary with rubric-based feedback and a
   "Continue to Case" transition. Responses autosave so the
   user can leave, revisit and edit at any time.
   ============================================================ */

const STAGE_LABELS = ["Problem statement", "Ambiguities", "Scope", "Review"];

const blankAmbiguity = (): ScopingAmbiguity => ({ term: "", why: "", clarification: "", assumption: false });

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function StageChips({ stage, furthest, onGo }: { stage: number; furthest: number; onGo: (s: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Problem scoping progress">
      {STAGE_LABELS.map((label, i) => {
        const done = i < furthest;
        const active = i === stage;
        const reachable = i <= furthest;
        return (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="muted">→</span>}
            <button
              type="button"
              className={`chip ${active ? "chip-active" : ""}`}
              style={reachable && !active ? { cursor: "pointer" } : { opacity: 0.55, cursor: "default" }}
              aria-pressed={active}
              aria-current={active ? "step" : undefined}
              disabled={!reachable}
              onClick={() => reachable && onGo(i)}
            >
              {done && !active ? "✓ " : `${i + 1} · `}
              {label}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function ProblemScoping({
  problemId,
  scoping,
  onEditingChange,
}: {
  problemId: string;
  scoping?: ScopingReference;
  onEditingChange: (editing: boolean) => void;
}) {
  const initial = loadScoping(problemId) ?? emptyScoping();
  const [data, setData] = useState<ScopingData>(initial);
  const [stage, setStage] = useState<number>(initial.completedAt ? 3 : 0);
  const [open, setOpen] = useState<boolean>(!initial.completedAt);
  const [hintShown, setHintShown] = useState(false);
  const [refShown, setRefShown] = useState(false);

  const furthest = maxStage(data);
  const keyTerms = scoping?.keyTerms ?? [];

  const update = (patch: Partial<ScopingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveScoping(problemId, next);
      return next;
    });
  };

  const updateAmbiguity = (i: number, patch: Partial<ScopingAmbiguity>) => {
    const list = data.ambiguities.length > 0 ? data.ambiguities : [blankAmbiguity()];
    const next = list.map((a, j) => (j === i ? { ...a, ...patch } : a));
    update({ ambiguities: next });
  };

  const removeAmbiguity = (i: number) => {
    const next = data.ambiguities.filter((_, j) => j !== i);
    update({ ambiguities: next });
  };

  const go = (s: number) => {
    setStage(s);
    setHintShown(false);
    setRefShown(false);
  };

  const continueToCase = () => {
    const completed = { ...data, completedAt: Date.now() };
    setData(completed);
    saveScoping(problemId, completed);
    setOpen(false);
    onEditingChange(false);
  };

  const editScoping = () => {
    setOpen(true);
    setStage(3);
    onEditingChange(true);
  };

  /* rows shown in steps 2 and 3 (one provisional row when the list is empty) */
  const rows = data.ambiguities.length > 0 ? data.ambiguities : [blankAmbiguity()];
  const step2Valid = scopingStageValid(data, 2);
  const step3Valid = scopingStageValid(data, 3);
  const feedback = evaluateScoping(data, keyTerms);

  if (!open) {
    /* completed — collapsed summary with an edit affordance */
    const assumptions = data.ambiguities.filter((a) => a.assumption).length;
    return (
      <section className="card-tint p-5 mb-4" aria-label="Problem scoping">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-64">
            <div className="label-tint mb-1">Problem scoping</div>
            <p className="text-[15px] font-semibold">{data.finalStatement}</p>
            <p className="muted text-[13px] mt-1">
              {data.ambiguities.length} ambiguit{data.ambiguities.length === 1 ? "y" : "ies"} identified ·{" "}
              {assumptions > 0 ? `${assumptions} assumption${assumptions === 1 ? "" : "s"} marked` : "all clarified"}
            </p>
          </div>
          <button type="button" className="btn-small" onClick={editScoping}>
            Edit scoping
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-5 mb-4" aria-label="Problem scoping">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <div className="label mb-1">Problem scoping</div>
          <h2 className="text-xl font-bold">Understand the problem before you solve it</h2>
        </div>
        {data.completedAt && (
          <button
            type="button"
            className="btn-small"
            onClick={() => {
              setOpen(false);
              onEditingChange(false);
            }}
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-5">
        <StageChips stage={stage} furthest={furthest} onGo={go} />
      </div>

      {/* ---------------- Step 1: problem statement ---------------- */}
      {stage === 0 && (
        <div className="space-y-4">
          <div>
            <div className="label mb-1">Step 1 · Define the problem statement</div>
            <p className="text-[17px]">
              Based on the information provided, write a one-line problem statement describing the problem you believe
              needs to be solved.
            </p>
          </div>
          <textarea
            className="field"
            rows={3}
            placeholder="e.g. Paid users cancel within the first month because they never build a workout habit."
            value={data.statement}
            onChange={(e) => update({ statement: e.target.value })}
            aria-label="Your one-line problem statement"
          />
          <p className="muted text-[13px]">Keep it to one sentence — who is affected, what is going wrong, why it matters.</p>
          <div>
            {hintShown ? (
              <p className="rounded-xl px-4 py-3 text-[15px]" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
                {GOOD_STATEMENT_HINT}
              </p>
            ) : (
              <button type="button" className="text-[14px] link" onClick={() => setHintShown(true)}>
                Show hint
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary"
              disabled={wordCount(data.statement) < 4}
              onClick={() => go(1)}
            >
              Next: Ambiguities
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Step 2: ambiguities ---------------- */}
      {stage === 1 && (
        <div className="space-y-4">
          <div>
            <div className="label mb-1">Step 2 · Identify ambiguities</div>
            <p className="text-[17px]">
              Identify the words or phrases in your problem statement that are ambiguous or need further clarification.
            </p>
          </div>
          <div className="rounded-xl p-4 text-[15px]" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="label mb-2">Example</div>
            <p className="mb-2">
              Problem statement: <em>"Improve customer retention."</em>
            </p>
            <ul className="space-y-1" style={{ listStyle: "disc", paddingLeft: 20 }}>
              <li>
                <strong>Retention:</strong> What does retention mean? 7-day, 30-day or annual retention?
              </li>
              <li>
                <strong>Customers:</strong> All customers or a particular customer segment?
              </li>
              <li>
                <strong>Improve:</strong> By how much?
              </li>
            </ul>
          </div>
          <p className="muted text-[14px]">
            Think about unclear goals, metrics, target users, scope, timelines and constraints.
          </p>
          {rows.map((a, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="label">Ambiguity {i + 1}</span>
                {(data.ambiguities.length > 0 || rows.length > 1) && (
                  <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => removeAmbiguity(i)}>
                    Remove
                  </button>
                )}
              </div>
              <input
                className="field mb-2"
                placeholder="Word or phrase from your statement (e.g. Retention)"
                value={a.term}
                onChange={(e) => updateAmbiguity(i, { term: e.target.value })}
                aria-label={`Ambiguity ${i + 1} term`}
              />
              <textarea
                className="field"
                rows={2}
                placeholder="Why is it ambiguous? What could it mean?"
                value={a.why}
                onChange={(e) => updateAmbiguity(i, { why: e.target.value })}
                aria-label={`Ambiguity ${i + 1} explanation`}
              />
            </div>
          ))}
          <div>
            <button type="button" className="text-[14px] link" onClick={() => update({ ambiguities: [...rows, blankAmbiguity()] })}>
              + Add ambiguity
            </button>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => go(0)}>
              Back
            </button>
            <button type="button" className="btn-primary" disabled={!step2Valid} onClick={() => go(2)}>
              Next: Scope
            </button>
          </div>
          {!step2Valid && (
            <p className="muted text-[13px]">
              Each ambiguity needs a term and a short reason before you can continue.
            </p>
          )}
        </div>
      )}

      {/* ---------------- Step 3: clarify and scope ---------------- */}
      {stage === 2 && (
        <div className="space-y-4">
          <div>
            <div className="label mb-1">Step 3 · Clarify and scope the problem</div>
            <p className="text-[17px]">
              Clarify the ambiguities you identified and rewrite your problem statement with a clearly defined scope.
            </p>
          </div>
          {rows.map((a, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="font-semibold">“{a.term || `Ambiguity ${i + 1}`}”</span>
                {a.why && <span className="muted text-[14px]">{a.why}</span>}
              </div>
              <textarea
                className="field mb-2"
                rows={2}
                placeholder={a.assumption ? "State your assumption…" : "Your clarification — or state an assumption below"}
                value={a.clarification}
                onChange={(e) => updateAmbiguity(i, { clarification: e.target.value })}
                aria-label={`Clarification for ${a.term || `ambiguity ${i + 1}`}`}
              />
              <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                <input
                  type="checkbox"
                  className="accent-[var(--accent)]"
                  checked={a.assumption}
                  onChange={(e) => updateAmbiguity(i, { assumption: e.target.checked })}
                />
                <span>Not stated in the case — treat this as my assumption</span>
              </label>
            </div>
          ))}
          <div>
            <div className="label mb-1">Revised statement</div>
            <p className="text-[17px] mb-2">Write your revised one-line problem statement.</p>
            <p className="muted text-[14px] mb-2">It should make clear:</p>
            <ul className="muted text-[14px] space-y-1" style={{ listStyle: "disc", paddingLeft: 20 }}>
              <li>Who is experiencing the problem?</li>
              <li>What problem needs to be addressed?</li>
              <li>What outcome are we trying to improve?</li>
              <li>What scope or constraints are relevant?</li>
            </ul>
          </div>
          <textarea
            className="field"
            rows={3}
            placeholder="Your revised one-line problem statement…"
            value={data.finalStatement}
            onChange={(e) => update({ finalStatement: e.target.value })}
            aria-label="Revised one-line problem statement"
          />
          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => go(1)}>
              Back
            </button>
            <button type="button" className="btn-primary" disabled={!step3Valid} onClick={() => go(3)}>
              Review summary
            </button>
          </div>
          {!step3Valid && (
            <p className="muted text-[13px]">
              Give every ambiguity a clarification or mark it as an assumption, and write the revised statement.
            </p>
          )}
        </div>
      )}

      {/* ---------------- Review: summary, evaluation, transition ---------------- */}
      {stage === 3 && (
        <div className="space-y-4">
          <div>
            <div className="label mb-1">Review</div>
            <p className="text-[17px]">Here is your problem-scoping exercise. Edit any step from the progress bar above.</p>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="label mb-1">1 · Original problem statement</div>
            <p className="text-[15px]">{data.statement}</p>
          </div>

          <div>
            <div className="label mb-2">2 · Ambiguities you identified</div>
            <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
              {data.ambiguities.map((a, i) => (
                <li key={i}>
                  <strong>{a.term}</strong> — {a.why}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label mb-2">3 · Clarifications and assumptions</div>
            <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
              {data.ambiguities.map((a, i) => (
                <li key={i}>
                  <strong>{a.term}:</strong>{" "}
                  {a.assumption ? (
                    <span>
                      <em>Assumption</em>
                      {a.clarification ? ` — ${a.clarification}` : ""}
                    </span>
                  ) : (
                    a.clarification
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="label mb-1">4 · Final scoped problem statement</div>
            <p className="text-[15px] font-semibold">{data.finalStatement}</p>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="label">Self-check rubric</span>
              <span className="font-semibold text-[15px]">
                {data.rubric.filter(Boolean).length}/{RUBRIC_ITEMS.length}
              </span>
            </div>
            <ul className="space-y-2">
              {RUBRIC_ITEMS.map((item, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2 cursor-pointer text-[15px]">
                    <input
                      type="checkbox"
                      className="mt-1 accent-[var(--accent)]"
                      checked={!!data.rubric[i]}
                      onChange={(e) => {
                        const next = [...data.rubric];
                        next[i] = e.target.checked;
                        update({ rubric: next });
                      }}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label mb-2">Feedback on your scoping</div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { title: "What you did well", items: feedback.well, color: "var(--chip-active)" },
                { title: "What you may have missed", items: feedback.missed },
                { title: "How to improve", items: feedback.improve },
              ].map(
                (block) =>
                  block.items.length > 0 && (
                    <div key={block.title} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="label mb-2">{block.title}</div>
                      <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
                        {block.items.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
            <p className="muted text-[13px] mt-2">
              Reasonable assumptions are never penalised — the case data is often deliberately incomplete.
            </p>
          </div>

          {scoping?.referenceStatement && (
            <div>
              {refShown ? (
                <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
                  <div className="label mb-1">How the reference scoped it</div>
                  <p className="text-[15px]">{scoping.referenceStatement}</p>
                  <button type="button" className="text-[13px] link mt-2" onClick={() => setRefShown(false)}>
                    Hide
                  </button>
                </div>
              ) : (
                <button type="button" className="text-[14px] link" onClick={() => setRefShown(true)}>
                  Compare with a reference scoping
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end">
            <button type="button" className="btn-primary" onClick={continueToCase}>
              Continue to Case
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
