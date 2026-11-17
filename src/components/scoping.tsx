import { useState } from "react";
import type { ScopingAmbiguity, ScopingData, ScopingReference } from "../lib/types";
import {
  GOOD_STATEMENT_HINT,
  RUBRIC_ITEMS,
  emptyScoping,
  evaluateScoping,
  loadScoping,
  saveScoping,
  scopingStageValid,
} from "../lib/scoping";

/* ============================================================
   Problem Scoping (Case Hours only).
   A single-page exercise: the statement, the ambiguities and
   the scope all live on one screen, so the user can always see
   the problem statement they wrote while picking ambiguous
   words out of it. The summary, rubric feedback and reference
   appear once all three sections are complete, followed by
   "Continue to Case". Responses autosave so the user can
   leave, revisit and edit at any time.
   ============================================================ */

const blankAmbiguity = (): ScopingAmbiguity => ({ term: "", why: "", clarification: "", assumption: false });

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

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
  const [open, setOpen] = useState<boolean>(!initial.completedAt);
  const [hintShown, setHintShown] = useState(false);
  const [refShown, setRefShown] = useState(false);

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

  const continueToCase = () => {
    const completed = { ...data, completedAt: Date.now() };
    setData(completed);
    saveScoping(problemId, completed);
    setOpen(false);
    onEditingChange(false);
  };

  const editScoping = () => {
    setOpen(true);
    onEditingChange(true);
  };

  const valid = scopingStageValid(data, 3);
  const feedback = evaluateScoping(data, keyTerms);
  const ambiguities = data.ambiguities;
  const entryRows = ambiguities.length > 0 ? ambiguities : [blankAmbiguity()];

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
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
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

      {/* ---------------- 1 · problem statement ---------------- */}
      <div className="space-y-3">
        <div>
          <div className="label mb-1">1 · Define the problem statement</div>
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
      </div>

      <hr className="my-6 border-0 border-t" style={{ borderColor: "var(--border)" }} />

      {/* ---------------- 2 · ambiguities ---------------- */}
      <div className="space-y-3">
        <div>
          <div className="label mb-1">2 · Identify ambiguities</div>
          <p className="text-[17px]">
            Identify the words or phrases in your problem statement — shown below — that are ambiguous or need further
            clarification.
          </p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
          <div className="label mb-1">Your problem statement</div>
          {wordCount(data.statement) >= 4 ? (
            <p className="text-[15px] italic">“{data.statement.trim()}”</p>
          ) : (
            <p className="muted text-[14px]">
              Write your statement in section 1 — it will appear here so you can pick out the ambiguous words.
            </p>
          )}
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
        {entryRows.map((a, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="label">Ambiguity {i + 1}</span>
              {(ambiguities.length > 0 || entryRows.length > 1) && (
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
          <button type="button" className="text-[14px] link" onClick={() => update({ ambiguities: [...entryRows, blankAmbiguity()] })}>
            + Add ambiguity
          </button>
        </div>
      </div>

      <hr className="my-6 border-0 border-t" style={{ borderColor: "var(--border)" }} />

      {/* ---------------- 3 · clarify and scope ---------------- */}
      <div className="space-y-3">
        <div>
          <div className="label mb-1">3 · Clarify and scope the problem</div>
          <p className="text-[17px]">
            Clarify the ambiguities you identified and rewrite your problem statement with a clearly defined scope.
          </p>
        </div>
        {ambiguities.length === 0 ? (
          <p className="muted text-[14px]">Add at least one ambiguity in section 2 — it will appear here for clarification.</p>
        ) : (
          ambiguities.map((a, i) => (
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
          ))
        )}
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
      </div>

      <hr className="my-6 border-0 border-t" style={{ borderColor: "var(--border)" }} />

      {/* ---------------- summary, feedback and transition ---------------- */}
      {valid ? (
        <div className="space-y-4">
          <div>
            <div className="label mb-2">Your scoping at a glance</div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="label mb-1">1 · Original problem statement</div>
            <p className="text-[15px]">{data.statement}</p>
          </div>

          <div>
            <div className="label mb-2">2 · Ambiguities you identified</div>
            <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
              {ambiguities.map((a, i) => (
                <li key={i}>
                  <strong>{a.term}</strong> — {a.why}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="label mb-2">3 · Clarifications and assumptions</div>
            <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
              {ambiguities.map((a, i) => (
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
                { title: "What you did well", items: feedback.well },
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
      ) : (
        <p className="muted text-[14px] rounded-xl px-4 py-3" style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          Complete all three sections above — each ambiguity needs a term and a short reason, then a clarification or an
          explicit assumption, plus your revised statement — and your summary, feedback and the Continue to Case button
          will appear here.
        </p>
      )}
    </section>
  );
}
