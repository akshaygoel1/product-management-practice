import type { AnswerData, SchemaId } from "../lib/types";

/* ============================================================
   Generic building blocks
   ============================================================ */

function Labeled({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="label block mb-1">{label}</span>
      {children}
    </label>
  );
}

function RowShell({
  index,
  label,
  onRemove,
  canRemove = true,
  children,
}: {
  index: number;
  label: string;
  onRemove: () => void;
  canRemove?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="label">
          {label} {index + 1}
        </span>
        {canRemove && (
          <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn-small" onClick={onClick}>
      + {label}
    </button>
  );
}

function ChildNodes({
  nodes,
  depth,
  maxDepth,
  onChange,
}: {
  nodes: { label: string; children: any[] }[];
  depth: number;
  maxDepth: number;
  onChange: (next: any[]) => void;
}) {
  if (depth >= maxDepth && nodes.length === 0) return null;
  return (
    <div className="space-y-3 mt-3">
      {nodes.map((n, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex gap-2 items-start">
            <input
              className="field"
              placeholder={depth === 0 ? "Level 1 metric (e.g. Ordering customers)" : "Child metric"}
              value={n.label}
              onChange={(e) => {
                const next = [...nodes];
                next[i] = { ...n, label: e.target.value };
                onChange(next);
              }}
            />
            <button type="button" className="text-[13px] muted underline underline-offset-2 shrink-0" onClick={() => onChange(nodes.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {depth < maxDepth - 1 && (
              <button
                type="button"
                className="text-[13px] link"
                onClick={() => {
                  const next = [...nodes];
                  next[i] = { ...n, children: [...(n.children ?? []), { label: "", children: [] }] };
                  onChange(next);
                }}
              >
                + Add child metric
              </button>
            )}
          </div>
          {n.children?.length > 0 && (
            <div className="pl-4">
              <ChildNodes nodes={n.children} depth={depth + 1} maxDepth={maxDepth} onChange={(kids) => {
                const next = [...nodes];
                next[i] = { ...n, children: kids };
                onChange(next);
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Editors
   ============================================================ */

function TreeEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { root: "", children: [] };
  return (
    <div className="space-y-4">
      <Labeled label="North-star metric">
        <input
          className="field"
          placeholder="The one outcome to grow (e.g. Monthly GMV)"
          value={v.root}
          onChange={(e) => onChange({ ...v, root: e.target.value })}
        />
      </Labeled>
      <div>
        <span className="label block mb-1">Child nodes (up to 3 levels)</span>
        <ChildNodes nodes={v.children} depth={0} maxDepth={3} onChange={(children) => onChange({ ...v, children })} />
        <div className="mt-3">
          <AddBtn
            label="Add level-1 node"
            onClick={() => onChange({ ...v, children: [...v.children, { label: "", children: [] }] })}
          />
        </div>
      </div>
    </div>
  );
}

function EdgeListEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { edges: [{ cause: "", effect: "", sign: "+" }], loops: "", confounders: "" };
  const setEdge = (i: number, patch: any) => {
    const edges = [...v.edges];
    edges[i] = { ...edges[i], ...patch };
    onChange({ ...v, edges });
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <span className="label block">Cause → effect edges</span>
        {v.edges.map((e: any, i: number) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto]" style={{ alignItems: "center" }}>
            <input className="field" placeholder="Cause (e.g. Rain)" value={e.cause} onChange={(ev) => setEdge(i, { cause: ev.target.value })} aria-label={`Edge ${i + 1} cause`} />
            <span aria-hidden="true" className="text-center">→</span>
            <input className="field" placeholder="Effect (e.g. Orders)" value={e.effect} onChange={(ev) => setEdge(i, { effect: ev.target.value })} aria-label={`Edge ${i + 1} effect`} />
            <div className="flex gap-2">
              <select className="field" style={{ width: 80 }} value={e.sign} onChange={(ev) => setEdge(i, { sign: ev.target.value })} aria-label={`Edge ${i + 1} direction`}>
                <option value="+">+</option>
                <option value="−">−</option>
              </select>
              <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, edges: v.edges.filter((_: any, j: number) => j !== i) })}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <AddBtn label="Add edge" onClick={() => onChange({ ...v, edges: [...v.edges, { cause: "", effect: "", sign: "+" }] })} />
      </div>
      <Labeled label="Feedback loops (optional)">
        <textarea className="field" placeholder="e.g. Balancing loop: Surge → Demand (−) → Surge (−)" value={v.loops} onChange={(e) => onChange({ ...v, loops: e.target.value })} />
      </Labeled>
      <Labeled label="Confounders">
        <textarea className="field" placeholder="What else could explain the effect?" value={v.confounders} onChange={(e) => onChange({ ...v, confounders: e.target.value })} />
      </Labeled>
    </div>
  );
}

function SegmentsEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { basis: "", segments: [{ name: "", criteria: "", size: "", need: "" }], priority: "", risk: "" };
  const setSeg = (i: number, patch: any) => {
    const segments = [...v.segments];
    segments[i] = { ...segments[i], ...patch };
    onChange({ ...v, segments });
  };
  return (
    <div className="space-y-4">
      <Labeled label="Segmentation basis (use one)">
        <input className="field" placeholder="e.g. Motivation, or behaviour in the first 30 days" value={v.basis} onChange={(e) => onChange({ ...v, basis: e.target.value })} />
      </Labeled>
      <div className="space-y-3">
        <span className="label block">Segments (3 to 6)</span>
        {v.segments.map((s: any, i: number) => (
          <RowShell key={i} index={i} label="Segment" onRemove={() => onChange({ ...v, segments: v.segments.filter((_: any, j: number) => j !== i) })}>
            <Labeled label="Name">
              <input className="field" value={s.name} onChange={(e) => setSeg(i, { name: e.target.value })} />
            </Labeled>
            <Labeled label="Defining criteria">
              <input className="field" value={s.criteria} onChange={(e) => setSeg(i, { criteria: e.target.value })} />
            </Labeled>
            <Labeled label="Size guess">
              <input className="field" value={s.size} onChange={(e) => setSeg(i, { size: e.target.value })} />
            </Labeled>
            <Labeled label="Key need">
              <input className="field" value={s.need} onChange={(e) => setSeg(i, { need: e.target.value })} />
            </Labeled>
          </RowShell>
        ))}
        <AddBtn label="Add segment" onClick={() => onChange({ ...v, segments: [...v.segments, { name: "", criteria: "", size: "", need: "" }] })} />
      </div>
      <Labeled label="Priority segment">
        <input className="field" placeholder="Which segment first?" value={v.priority} onChange={(e) => onChange({ ...v, priority: e.target.value })} />
      </Labeled>
      <Labeled label="Risk or caveat (optional)">
        <input className="field" value={v.risk} onChange={(e) => onChange({ ...v, risk: e.target.value })} />
      </Labeled>
    </div>
  );
}

function HypothesesTableEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { hypotheses: [{ hypothesis: "", check: "" }], finding: "" };
  const setH = (i: number, patch: any) => {
    const hypotheses = [...v.hypotheses];
    hypotheses[i] = { ...hypotheses[i], ...patch };
    onChange({ ...v, hypotheses });
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <span className="label block">Hypotheses, ordered (test the first first)</span>
        {v.hypotheses.map((h: any, i: number) => (
          <RowShell key={i} index={i} label="Hypothesis" onRemove={() => onChange({ ...v, hypotheses: v.hypotheses.filter((_: any, j: number) => j !== i) })}>
            <Labeled label="Hypothesis">
              <textarea className="field" value={h.hypothesis} onChange={(e) => setH(i, { hypothesis: e.target.value })} />
            </Labeled>
            <Labeled label="Data you would pull">
              <textarea className="field" value={h.check} onChange={(e) => setH(i, { check: e.target.value })} />
            </Labeled>
          </RowShell>
        ))}
        <AddBtn label="Add hypothesis" onClick={() => onChange({ ...v, hypotheses: [...v.hypotheses, { hypothesis: "", check: "" }] })} />
      </div>
      <Labeled label="Most likely root cause" wide>
        <textarea className="field" placeholder="After checking the data, what is really going on?" value={v.finding} onChange={(e) => onChange({ ...v, finding: e.target.value })} />
      </Labeled>
    </div>
  );
}

function AssumptionsTableEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { assumptions: [{ label: "", value: "" }], formula: "", result: "" };
  const setA = (i: number, patch: any) => {
    const assumptions = [...v.assumptions];
    assumptions[i] = { ...assumptions[i], ...patch };
    onChange({ ...v, assumptions });
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <span className="label block">Assumption rows</span>
        {v.assumptions.map((a: any, i: number) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" style={{ alignItems: "center" }}>
            <input className="field" placeholder="Label (e.g. Households)" aria-label={`Assumption ${i + 1} label`} value={a.label} onChange={(e) => setA(i, { label: e.target.value })} />
            <input className="field" placeholder="Value (e.g. ~3.2M)" aria-label={`Assumption ${i + 1} value`} value={a.value} onChange={(e) => setA(i, { value: e.target.value })} />
            <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, assumptions: v.assumptions.filter((_: any, j: number) => j !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <AddBtn label="Add assumption" onClick={() => onChange({ ...v, assumptions: [...v.assumptions, { label: "", value: "" }] })} />
      </div>
      <Labeled label="Formula">
        <textarea className="field" placeholder="How the numbers combine" value={v.formula} onChange={(e) => onChange({ ...v, formula: e.target.value })} />
      </Labeled>
      <Labeled label="Final number">
        <input className="field" placeholder="e.g. ≈ ₹173 crore a year" value={v.result} onChange={(e) => onChange({ ...v, result: e.target.value })} />
      </Labeled>
    </div>
  );
}

function HypothesisListEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { items: [{ text: "", metric: "" }], notes: "" };
  const setI = (i: number, patch: any) => {
    const items = [...v.items];
    items[i] = { ...items[i], ...patch };
    onChange({ ...v, items });
  };
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <span className="label block">Hypotheses — “We believe… because… so we expect…”</span>
        {v.items.map((h: any, i: number) => (
          <RowShell key={i} index={i} label="Hypothesis" onRemove={() => onChange({ ...v, items: v.items.filter((_: any, j: number) => j !== i) })}>
            <Labeled label="We believe / because / so we expect" wide>
              <textarea className="field" value={h.text} onChange={(e) => setI(i, { text: e.target.value })} />
            </Labeled>
            <Labeled label="Metric to test" wide>
              <input className="field" value={h.metric} onChange={(e) => setI(i, { metric: e.target.value })} />
            </Labeled>
          </RowShell>
        ))}
        <AddBtn label="Add hypothesis" onClick={() => onChange({ ...v, items: [...v.items, { text: "", metric: "" }] })} />
      </div>
      <Labeled label="Ranking or test notes (optional)" wide>
        <textarea className="field" value={v.notes} onChange={(e) => onChange({ ...v, notes: e.target.value })} />
      </Labeled>
    </div>
  );
}

function SurveyBuilderEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { goal: "", respondents: "", questions: [{ text: "", type: "single", options: "" }] };
  const setQ = (i: number, patch: any) => {
    const questions = [...v.questions];
    questions[i] = { ...questions[i], ...patch };
    onChange({ ...v, questions });
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Labeled label="Research goal">
          <input className="field" value={v.goal} onChange={(e) => onChange({ ...v, goal: e.target.value })} />
        </Labeled>
        <Labeled label="Target respondents">
          <input className="field" value={v.respondents} onChange={(e) => onChange({ ...v, respondents: e.target.value })} />
        </Labeled>
      </div>
      <div className="space-y-3">
        <span className="label block">Questions (start with a screener)</span>
        {v.questions.map((q: any, i: number) => (
          <RowShell key={i} index={i} label="Question" onRemove={() => onChange({ ...v, questions: v.questions.filter((_: any, j: number) => j !== i) })}>
            <Labeled label="Question text" wide>
              <input className="field" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} />
            </Labeled>
            <Labeled label="Type">
              <select className="field" value={q.type} onChange={(e) => setQ(i, { type: e.target.value })}>
                <option value="single">Single choice</option>
                <option value="multi">Multi choice</option>
                <option value="scale">Scale</option>
                <option value="open">Open text</option>
                <option value="rank">Ranking</option>
              </select>
            </Labeled>
            <Labeled label="Options (one per line)">
              <textarea className="field" value={q.options} onChange={(e) => setQ(i, { options: e.target.value })} />
            </Labeled>
          </RowShell>
        ))}
        <AddBtn label="Add question" onClick={() => onChange({ ...v, questions: [...v.questions, { text: "", type: "single", options: "" }] })} />
      </div>
    </div>
  );
}

function QuestionListEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { goals: "", questions: [{ label: "", text: "" }], probes: "", avoid: [{ text: "", why: "" }] };
  const setQ = (i: number, patch: any) => {
    const questions = [...v.questions];
    questions[i] = { ...questions[i], ...patch };
    onChange({ ...v, questions });
  };
  const setAv = (i: number, patch: any) => {
    const avoid = [...v.avoid];
    avoid[i] = { ...avoid[i], ...patch };
    onChange({ ...v, avoid });
  };
  return (
    <div className="space-y-4">
      <Labeled label="Learning goals">
        <textarea className="field" placeholder="One per line" value={v.goals} onChange={(e) => onChange({ ...v, goals: e.target.value })} />
      </Labeled>
      <div className="space-y-3">
        <span className="label block">Questions in rough order</span>
        {v.questions.map((q: any, i: number) => (
          <div key={i} className="grid gap-2 md:grid-cols-[180px_1fr_auto]" style={{ alignItems: "center" }}>
            <input className="field" placeholder="Section (optional)" aria-label={`Question ${i + 1} section`} value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} />
            <input className="field" placeholder="Open question" aria-label={`Question ${i + 1} text`} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} />
            <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, questions: v.questions.filter((_: any, j: number) => j !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <AddBtn label="Add question" onClick={() => onChange({ ...v, questions: [...v.questions, { label: "", text: "" }] })} />
      </div>
      <Labeled label="Follow-up probes (optional)">
        <textarea className="field" placeholder="One per line" value={v.probes} onChange={(e) => onChange({ ...v, probes: e.target.value })} />
      </Labeled>
      <div className="space-y-3">
        <span className="label block">Questions to avoid</span>
        {v.avoid.map((a: any, i: number) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" style={{ alignItems: "center" }}>
            <input className="field" placeholder="Question" aria-label={`Avoid ${i + 1} question`} value={a.text} onChange={(e) => setAv(i, { text: e.target.value })} />
            <input className="field" placeholder="Why" aria-label={`Avoid ${i + 1} reason`} value={a.why} onChange={(e) => setAv(i, { why: e.target.value })} />
            <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, avoid: v.avoid.filter((_: any, j: number) => j !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <AddBtn label="Add question to avoid" onClick={() => onChange({ ...v, avoid: [...v.avoid, { text: "", why: "" }] })} />
      </div>
    </div>
  );
}

const CANVAS_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "focus", label: "Focus (if the problem is broad)" },
  { key: "who", label: "Who" },
  { key: "problem", label: "Problem" },
  { key: "whyNow", label: "Why now" },
  { key: "evidence", label: "Evidence" },
  { key: "impact", label: "Impact" },
  { key: "constraints", label: "Constraints" },
  { key: "successMetric", label: "Success metric" },
  { key: "unknowns", label: "What you don't yet know" },
];

function CanvasFieldsEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? Object.fromEntries(CANVAS_FIELDS.map((f) => [f.key, ""]));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CANVAS_FIELDS.map((f) => (
        <Labeled key={f.key} label={f.label}>
          <textarea className="field" style={{ minHeight: 76 }} value={v[f.key] ?? ""} onChange={(e) => onChange({ ...v, [f.key]: e.target.value })} />
        </Labeled>
      ))}
    </div>
  );
}

function ScoreMatrixEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { criteria: [""], rows: [{ name: "", scores: [3] }], pick: "", reasoning: "" };
  const setCriteria = (i: number, val: string) => {
    const criteria = [...v.criteria];
    criteria[i] = val;
    const rows = v.rows.map((r: any) => {
      const scores = [...r.scores];
      while (scores.length < criteria.length) scores.push(3);
      return { ...r, scores: scores.slice(0, criteria.length) };
    });
    onChange({ ...v, criteria, rows });
  };
  const setScore = (ri: number, ci: number, val: number) => {
    const rows = [...v.rows];
    const scores = [...rows[ri].scores];
    scores[ci] = val;
    rows[ri] = { ...rows[ri], scores };
    onChange({ ...v, rows });
  };
  return (
    <div className="space-y-4">
      <div>
        <span className="label block mb-2">Criteria (3 to 5)</span>
        <div className="grid gap-2 md:grid-cols-2">
          {v.criteria.map((c: string, i: number) => (
            <div key={i} className="flex gap-2">
              <input className="field" placeholder={`Criterion ${i + 1}`} aria-label={`Criterion ${i + 1}`} value={c} onChange={(e) => setCriteria(i, e.target.value)} />
              <button type="button" className="text-[13px] muted underline underline-offset-2 shrink-0" onClick={() => onChange({ ...v, criteria: v.criteria.filter((_: string, j: number) => j !== i) })}>
                Remove
              </button>
            </div>
          ))}
        </div>
        {v.criteria.length < 5 && (
          <div className="mt-2">
            <AddBtn label="Add criterion" onClick={() => onChange({ ...v, criteria: [...v.criteria, ""], rows: v.rows.map((r: any) => ({ ...r, scores: [...r.scores, 3] })) })} />
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="label text-left pb-2 pr-2">Idea</th>
              {v.criteria.map((_: string, ci: number) => (
                <th key={ci} className="label pb-2 px-1">{`C${ci + 1}`}</th>
              ))}
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {v.rows.map((r: any, ri: number) => (
              <tr key={ri}>
                <td className="pr-2 py-1">
                  <input className="field" placeholder="Idea name" aria-label={`Row ${ri + 1} idea`} value={r.name} onChange={(e) => {
                    const rows = [...v.rows];
                    rows[ri] = { ...r, name: e.target.value };
                    onChange({ ...v, rows });
                  }} />
                </td>
                {v.criteria.map((_: string, ci: number) => (
                  <td key={ci} className="px-1 py-1">
                    <input
                      className="field text-center"
                      style={{ width: 64 }}
                      type="number"
                      min={1}
                      max={5}
                      aria-label={`Row ${ri + 1} score for criterion ${ci + 1}`}
                      value={r.scores[ci] ?? 3}
                      onChange={(e) => setScore(ri, ci, Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, rows: v.rows.filter((_: any, j: number) => j !== ri) })}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2">
          <AddBtn label="Add idea row" onClick={() => onChange({ ...v, rows: [...v.rows, { name: "", scores: v.criteria.map(() => 3) }] })} />
        </div>
      </div>
      <Labeled label="Final pick">
        <input className="field" value={v.pick} onChange={(e) => onChange({ ...v, pick: e.target.value })} />
      </Labeled>
      <Labeled label="Reasoning" wide>
        <textarea className="field" value={v.reasoning} onChange={(e) => onChange({ ...v, reasoning: e.target.value })} />
      </Labeled>
    </div>
  );
}

function MetricSetEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { northStar: "", inputs: [{ name: "", definition: "" }], guardrails: [{ name: "", definition: "" }], counter: [{ name: "", definition: "" }] };
  const listEditor = (key: "inputs" | "guardrails" | "counter") => (
    <div className="space-y-3">
      <span className="label block">{key === "inputs" ? "Input metrics" : key === "guardrails" ? "Guardrails" : "Counter-metrics"}</span>
      {v[key].map((m: any, i: number) => (
        <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" style={{ alignItems: "center" }}>
          <input className="field" placeholder="Metric name" aria-label={`Metric ${i + 1} name`} value={m.name} onChange={(e) => {
            const arr = [...v[key]];
            arr[i] = { ...m, name: e.target.value };
            onChange({ ...v, [key]: arr });
          }} />
          <input className="field" placeholder="Definition" aria-label={`Metric ${i + 1} definition`} value={m.definition} onChange={(e) => {
            const arr = [...v[key]];
            arr[i] = { ...m, definition: e.target.value };
            onChange({ ...v, [key]: arr });
          }} />
          <button type="button" className="text-[13px] muted underline underline-offset-2" onClick={() => onChange({ ...v, [key]: v[key].filter((_: any, j: number) => j !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <AddBtn label="Add metric" onClick={() => onChange({ ...v, [key]: [...v[key], { name: "", definition: "" }] })} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Labeled label="North-star metric" wide>
        <input className="field" value={v.northStar} onChange={(e) => onChange({ ...v, northStar: e.target.value })} />
      </Labeled>
      {listEditor("inputs")}
      {listEditor("guardrails")}
      {listEditor("counter")}
    </div>
  );
}

function WireframeListEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { screens: [{ name: "", parts: "", notes: "" }] };
  const setS = (i: number, patch: any) => {
    const screens = [...v.screens];
    screens[i] = { ...screens[i], ...patch };
    onChange({ ...v, screens });
  };
  return (
    <div className="space-y-3">
      <span className="label block">Screens, in order</span>
      {v.screens.map((s: any, i: number) => (
        <RowShell key={i} index={i} label="Screen" onRemove={() => onChange({ ...v, screens: v.screens.filter((_: any, j: number) => j !== i) })}>
          <Labeled label="Screen name" wide>
            <input className="field" value={s.name} onChange={(e) => setS(i, { name: e.target.value })} />
          </Labeled>
          <Labeled label="Components, top to bottom (one per line)" wide>
            <textarea className="field" style={{ minHeight: 110 }} value={s.parts} onChange={(e) => setS(i, { parts: e.target.value })} />
          </Labeled>
          <Labeled label="Notes / states / design decision" wide>
            <textarea className="field" value={s.notes} onChange={(e) => setS(i, { notes: e.target.value })} />
          </Labeled>
        </RowShell>
      ))}
      <AddBtn label="Add screen" onClick={() => onChange({ ...v, screens: [...v.screens, { name: "", parts: "", notes: "" }] })} />
    </div>
  );
}

function FlowEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const v = value ?? { steps: [{ lane: "", type: "action", text: "", branches: "" }] };
  const setSt = (i: number, patch: any) => {
    const steps = [...v.steps];
    steps[i] = { ...steps[i], ...patch };
    onChange({ ...v, steps });
  };
  return (
    <div className="space-y-3">
      <span className="label block">Steps, in order</span>
      {v.steps.map((s: any, i: number) => (
        <RowShell key={i} index={i} label="Step" onRemove={() => onChange({ ...v, steps: v.steps.filter((_: any, j: number) => j !== i) })}>
          <Labeled label="Lane (optional, e.g. Organiser)">
            <input className="field" value={s.lane} onChange={(e) => setSt(i, { lane: e.target.value })} />
          </Labeled>
          <Labeled label="Type">
            <select className="field" value={s.type} onChange={(e) => setSt(i, { type: e.target.value })}>
              <option value="action">Action</option>
              <option value="decision">Decision</option>
              <option value="end">End</option>
            </select>
          </Labeled>
          <Labeled label="What happens" wide>
            <textarea className="field" value={s.text} onChange={(e) => setSt(i, { text: e.target.value })} />
          </Labeled>
          {s.type === "decision" && (
            <Labeled label="Branches (one per line, e.g. “Yes: …”)" wide>
              <textarea className="field" value={s.branches} onChange={(e) => setSt(i, { branches: e.target.value })} />
            </Labeled>
          )}
        </RowShell>
      ))}
      <AddBtn label="Add step" onClick={() => onChange({ ...v, steps: [...v.steps, { lane: "", type: "action", text: "", branches: "" }] })} />
    </div>
  );
}

/* ============================================================
   Registry
   ============================================================ */

export const editors: Record<SchemaId, (p: { value: any; onChange: (v: any) => void }) => JSX.Element> = {
  "kpi-tree": TreeEditor,
  "causal-diagram": EdgeListEditor,
  "user-segmentation": SegmentsEditor,
  "root-cause": HypothesesTableEditor,
  "opportunity-sizing": AssumptionsTableEditor,
  hypothesis: HypothesisListEditor,
  survey: SurveyBuilderEditor,
  interview: QuestionListEditor,
  "problem-framing": CanvasFieldsEditor,
  "idea-filters": ScoreMatrixEditor,
  metrics: MetricSetEditor,
  wireframing: WireframeListEditor,
  "user-flow": FlowEditor,
};

export function AnswerEditor({ schema, value, onChange }: { schema: SchemaId; value: AnswerData | null; onChange: (v: any) => void }) {
  const Editor = editors[schema];
  return <Editor value={value} onChange={onChange} />;
}
