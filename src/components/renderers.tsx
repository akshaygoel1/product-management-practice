import type { SchemaId } from "../lib/types";

/* ============================================================
   Reference renderers — data-driven, per PRD section 6:
   trees as nested lists, flows as boxes and arrows,
   wireframes as grey blocks.
   ============================================================ */

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="label mb-2">{label}</div>
      {children}
    </div>
  );
}

function Box({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-[15px]"
      style={{
        background: "var(--ref-box)",
        border: "1px solid var(--ref-box-border)",
        fontWeight: strong ? 600 : 400,
      }}
    >
      {children}
    </div>
  );
}

function TreeNode({ node, depth = 0 }: { node: any; depth?: number }) {
  return (
    <li>
      <div style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
        <Box strong={depth === 0}>
          {node.label}
          {node.formula ? <span className="muted"> = {node.formula}</span> : null}
          {node.levers?.length > 0 && (
            <div className="mt-1 text-[13px] muted">Levers: {node.levers.join(", ")}</div>
          )}
        </Box>
      </div>
      {node.children?.length > 0 && (
        <ul className="mt-2 space-y-2" style={{ listStyle: "none" }}>
          {node.children.map((c: any, i: number) => (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function KpiTreeRef({ content }: { content: any }) {
  return (
    <div>
      <ul style={{ listStyle: "none" }} className="space-y-2">
        <TreeNode node={content.root} />
      </ul>
      {content.firstLevers?.length > 0 && (
        <p className="mt-4 text-[15px]">
          <strong>Test first:</strong> {content.firstLevers.join(", ")}.
        </p>
      )}
    </div>
  );
}

function CausalRef({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2" style={{ listStyle: "none" }}>
        {(content.edges ?? []).map((e: any, i: number) => (
          <li key={i}>
            <Box>
              <strong>{e.cause}</strong> → {e.effect}{" "}
              <span aria-hidden="true">({e.sign})</span>
              {e.note ? <span className="muted"> — {e.note}</span> : null}
            </Box>
          </li>
        ))}
      </ul>
      {content.loops?.length > 0 && (
        <Sec label="Feedback loops">
          <ul className="space-y-1 list-disc pl-5 text-[15px]">
            {content.loops.map((l: string, i: number) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </Sec>
      )}
      {content.confounders?.length > 0 && (
        <Sec label="Confounders">
          <ul className="space-y-1 list-disc pl-5 text-[15px]">
            {content.confounders.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Sec>
      )}
      {content.insight && <p className="text-[15px] mt-3">{content.insight}</p>}
    </div>
  );
}

function SegmentsRef({ content }: { content: any }) {
  return (
    <div>
      {content.basis && <p className="text-[15px] mb-3"><strong>Basis:</strong> {content.basis}</p>}
      <ul className="space-y-2" style={{ listStyle: "none" }}>
        {(content.segments ?? []).map((s: any, i: number) => (
          <li key={i}>
            <Box>
              <strong>{s.name}</strong>
              {s.criteria ? <span className="muted"> — {s.criteria}</span> : null}
              {s.size ? <span> — {s.size}</span> : null}
              {s.need ? <span> — {s.need}</span> : null}
            </Box>
          </li>
        ))}
      </ul>
      {content.priority?.name && (
        <p className="mt-4 text-[15px]">
          <strong>Priority: {content.priority.name}</strong>
          {content.priority.reason ? ` — ${content.priority.reason}` : ""}
        </p>
      )}
      {content.risk && (
        <p className="mt-2 text-[15px]">
          <strong>Risk:</strong> {content.risk}
        </p>
      )}
    </div>
  );
}

function RootCauseRef({ content }: { content: any }) {
  return (
    <div>
      <ol className="space-y-2 list-decimal pl-5 text-[15px]">
        {(content.hypotheses ?? []).map((h: any, i: number) => (
          <li key={i}>
            {h.hypothesis}
            {h.check ? <span className="muted"> — check: {h.check}</span> : null}
          </li>
        ))}
      </ol>
      {content.finding && (
        <p className="mt-4 text-[15px]">
          <strong>Root cause:</strong> {content.finding}
        </p>
      )}
    </div>
  );
}

function AssumptionsRef({ content }: { content: any }) {
  return (
    <div>
      <ul className="space-y-2" style={{ listStyle: "none" }}>
        {(content.assumptions ?? []).map((a: any, i: number) => (
          <li key={i}>
            <Box>
              {a.label}: {a.value}
            </Box>
          </li>
        ))}
      </ul>
      {content.formula && (
        <p className="mt-3 text-[15px]">
          <strong>Formula:</strong> {content.formula}
        </p>
      )}
      {content.result && (
        <p className="mt-2 text-[15px]">
          <strong>Result:</strong> {content.result}
        </p>
      )}
      {content.sanity ? (
        <p className="mt-2 text-[15px]">
          <strong>Sanity check:</strong> {content.sanity}
        </p>
      ) : null}
    </div>
  );
}

function HypothesisRef({ content }: { content: any }) {
  return (
    <div>
      <ol className="space-y-2 list-decimal pl-5 text-[15px]">
        {(content.items ?? []).map((h: any, i: number) => (
          <li key={i}>
            {h.text}
            {h.metric ? <div className="muted text-[14px]">{h.metric}</div> : null}
          </li>
        ))}
      </ol>
      {content.notes && <p className="mt-3 text-[15px]">{content.notes}</p>}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  single: "single choice",
  multi: "multi choice",
  scale: "scale",
  open: "open text",
  rank: "ranking",
};

function SurveyRef({ content }: { content: any }) {
  return (
    <div>
      <p className="text-[15px]">
        <strong>Goal:</strong> {content.goal}
      </p>
      <p className="text-[15px] mt-1">
        <strong>Respondents:</strong> {content.respondents}
      </p>
      <ol className="mt-4 space-y-3 list-decimal pl-5 text-[15px]">
        {(content.questions ?? []).map((q: any, i: number) => (
          <li key={i}>
            <div>{q.text}</div>
            <div className="muted text-[13px] uppercase tracking-wide">{TYPE_LABEL[q.type] ?? q.type}</div>
            {q.options && q.type !== "open" && (
              <div className="muted text-[14px]">({q.options.join(" · ")})</div>
            )}
            {q.note ? <div className="text-[14px]">{q.note}</div> : null}
          </li>
        ))}
      </ol>
      {content.notes && <p className="mt-3 text-[15px]">{content.notes}</p>}
    </div>
  );
}

function InterviewRef({ content }: { content: any }) {
  const sections: [string, React.ReactNode][] = [];
  if (content.goals?.length > 0) {
    sections.push([
      "Learning goals",
      <ul key="g" className="list-disc pl-5 space-y-1 text-[15px]">
        {content.goals.map((g: string, i: number) => (
          <li key={i}>{g}</li>
        ))}
      </ul>,
    ]);
  }
  sections.push([
    "Questions",
    <ol key="q" className="list-decimal pl-5 space-y-2 text-[15px]">
      {(content.questions ?? []).map((q: any, i: number) => (
        <li key={i}>
          {q.label ? <span className="muted">({q.label}) </span> : null}
          {q.text}
        </li>
      ))}
    </ol>,
  ]);
  if (content.probes?.length > 0) {
    sections.push([
      "Follow-up probes",
      <ul key="p" className="list-disc pl-5 space-y-1 text-[15px]">
        {content.probes.map((p: string, i: number) => (
          <li key={i}>{p}</li>
        ))}
      </ul>,
    ]);
  }
  if (content.approach?.length > 0) {
    sections.push([
      "Reducing socially desirable answers",
      <ul key="a" className="list-disc pl-5 space-y-1 text-[15px]">
        {content.approach.map((a: string, i: number) => (
          <li key={i}>{a}</li>
        ))}
      </ul>,
    ]);
  }
  if (content.children?.length > 0) {
    sections.push([
      "Learning from children — ethical plan",
      <ul key="c" className="list-disc pl-5 space-y-1 text-[15px]">
        {content.children.map((c: string, i: number) => (
          <li key={i}>{c}</li>
        ))}
      </ul>,
    ]);
  }
  if (content.avoid?.length > 0) {
    sections.push([
      "Questions to avoid",
      <ul key="av" className="list-disc pl-5 space-y-1 text-[15px]">
        {content.avoid.map((a: any, i: number) => (
          <li key={i}>
            “{a.text}” <span className="muted">— {a.why}</span>
          </li>
        ))}
      </ul>,
    ]);
  }
  return (
    <div>
      {sections.map(([label, node], i) => (
        <Sec key={i} label={label}>
          {node}
        </Sec>
      ))}
    </div>
  );
}

function CanvasRef({ content }: { content: any }) {
  const fields: [string, string | undefined][] = [
    ["Focus", content.focus],
    ["Who", content.who],
    ["Problem", content.problem],
    ["Why now", content.whyNow],
    ["Evidence", content.evidence],
    ["Impact", content.impact],
    ["Constraints", content.constraints],
    ["What you don't yet know", content.unknowns],
    ["Success metric", content.successMetric],
  ];
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {fields
        .filter(([, v]) => !!v)
        .map(([label, v], i) => (
          <div key={i} className="rounded-xl px-4 py-3" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
            <div className="label">{label}</div>
            <div className="text-[15px]">{v}</div>
          </div>
        ))}
    </div>
  );
}

function ScoreMatrixRef({ content }: { content: any }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className="label text-left py-2 pr-3">Idea</th>
              {(content.criteria ?? []).map((c: string, i: number) => (
                <th key={i} className="label py-2 px-2 text-center">
                  {c}
                </th>
              ))}
              <th className="label py-2 px-2 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {(content.ideas ?? []).map((idea: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid var(--ref-box-border)" }}>
                <td className="py-2 pr-3">
                  {idea.name}
                  {idea.note ? <div className="muted text-[13px]">{idea.note}</div> : null}
                </td>
                {(idea.scores ?? []).map((s: number, j: number) => (
                  <td key={j} className="py-2 px-2 text-center">
                    {s}
                  </td>
                ))}
                <td className="py-2 px-2 text-center font-semibold">{idea.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {content.formula && <p className="muted text-[14px] mt-2">{content.formula}</p>}
      {content.pick && (
        <p className="mt-3 text-[15px]">
          <strong>Pick:</strong> {content.pick}
        </p>
      )}
      {content.reasoning && <p className="text-[15px] mt-1">{content.reasoning}</p>}
      {content.kill && (
        <p className="text-[15px] mt-1">
          <strong>Kill:</strong> {content.kill}
        </p>
      )}
      {content.sensitivity && (
        <p className="text-[15px] mt-1">
          <strong>Sensitivity:</strong> {content.sensitivity}
        </p>
      )}
    </div>
  );
}

function MetricsRef({ content }: { content: any }) {
  const list = (items: any[]) => (
    <ul className="space-y-1 list-disc pl-5 text-[15px]">
      {items.map((m, i) => (
        <li key={i}>
          {m.name}
          {m.definition ? <span className="muted"> — {m.definition}</span> : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <Box strong>{content.northStar}</Box>
      <Sec label="Input metrics">{list(content.inputs ?? [])}</Sec>
      <Sec label="Guardrails">{list(content.guardrails ?? [])}</Sec>
      <Sec label="Counter-metrics">{list(content.counter ?? [])}</Sec>
      {content.gaming && <p className="mt-3 text-[15px]">{content.gaming}</p>}
    </div>
  );
}

function WireframeRef({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      {(content.screens ?? []).map((s: any, i: number) => (
        <div key={i} className="rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
          <div className="font-semibold mb-2">{s.name}</div>
          <ol className="space-y-1 list-decimal pl-5 text-[15px]">
            {(s.parts ?? []).map((p: string, j: number) => (
              <li key={j}>{p}</li>
            ))}
          </ol>
          {s.notes ? <div className="muted text-[14px] mt-2">{s.notes}</div> : null}
        </div>
      ))}
      {content.states?.length > 0 && (
        <Sec label="States">
          <ul className="space-y-1 list-disc pl-5 text-[15px]">
            {content.states.map((st: any, i: number) => (
              <li key={i}>
                <strong>{st.name}:</strong> {st.text}
              </li>
            ))}
          </ul>
        </Sec>
      )}
    </div>
  );
}

const TYPE_COLOR: Record<string, string> = {
  action: "#eef0fc",
  decision: "#fdf3d8",
  end: "#e5f3ea",
};

function FlowRef({ content }: { content: any }) {
  return (
    <div className="space-y-2">
      {(content.steps ?? []).map((s: any, i: number) => (
        <div key={i}>
          {i > 0 && <div aria-hidden="true" className="muted text-center" style={{ lineHeight: 0.6 }}>↓</div>}
          <div
            className="rounded-xl px-4 py-2 text-[15px]"
            style={{
              background: TYPE_COLOR[s.type] ?? "var(--ref-box)",
              border: "1px solid var(--ref-box-border)",
              color: "#1c1c1c",
            }}
          >
            <span className="muted text-[13px] mr-2">
              {s.n}
              {s.lane ? ` · ${s.lane}` : ""} · {s.type}
            </span>
            {s.text}
            {s.branches?.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-[14px]">
                {s.branches.map((b: string, j: number) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
      {content.extras?.length > 0 && (
        <Sec label="Edge cases">
          <ul className="list-disc pl-5 text-[15px]">
            {content.extras.map((e: string, i: number) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Sec>
      )}
    </div>
  );
}

/* Business-case reference: numbered model-answer sections + key consideration */
function CaseRef({ content }: { content: any }) {
  return (
    <div>
      {(content.sections ?? []).map((s: any, i: number) => (
        <Sec key={i} label={s.title ?? `Section ${i + 1}`}>
          <ul className="space-y-1.5 text-[15px]" style={{ listStyle: "disc", paddingLeft: 20 }}>
            {(s.points ?? []).map((p: string, j: number) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
        </Sec>
      ))}
      {content.consideration && (
        <div className="mt-4">
          <Box>
            <strong>Key consideration:</strong> {content.consideration}
          </Box>
        </div>
      )}
    </div>
  );
}

const referenceRenderers: Record<SchemaId, (p: { content: any }) => JSX.Element> = {
  "kpi-tree": KpiTreeRef,
  "causal-diagram": CausalRef,
  "user-segmentation": SegmentsRef,
  "root-cause": RootCauseRef,
  "opportunity-sizing": AssumptionsRef,
  hypothesis: HypothesisRef,
  survey: SurveyRef,
  interview: InterviewRef,
  "problem-framing": CanvasRef,
  "idea-filters": ScoreMatrixRef,
  metrics: MetricsRef,
  wireframing: WireframeRef,
  "user-flow": FlowRef,
  "case-analysis": CaseRef,
};

export function ReferenceView({ schema, content }: { schema: SchemaId; content: any }) {
  const R = referenceRenderers[schema];
  return <R content={content} />;
}

/* ============================================================
   Read-only summary of the user's answer (recap / side-by-side)
   ============================================================ */

export function summarizeAnswer(schema: SchemaId, data: any, labels?: string[]): string[] {
  if (!data) return [];
  const out: string[] = [];
  const val = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
  const push = (s: string) => {
    if (s && s.trim()) out.push(s.trim());
  };
  /* labeled line, only when the value has something in it */
  const pushL = (label: string, v: unknown) => {
    if (val(v)) push(`${label}: ${val(v)}`);
  };
  switch (schema) {
    case "kpi-tree": {
      pushL("North-star", data.root);
      const walk = (nodes: any[], depth: number) => {
        for (const n of nodes ?? []) {
          if (val(n.label)) push(`${"— ".repeat(depth)}${val(n.label)}`);
          walk(n.children, depth + 1);
        }
      };
      walk(data.children, 1);
      break;
    }
    case "causal-diagram":
      for (const e of data.edges ?? []) {
        if (val(e.cause) || val(e.effect)) push(`${val(e.cause)} → ${val(e.effect)} (${e.sign})`);
      }
      pushL("Loops", data.loops);
      pushL("Confounders", data.confounders);
      break;
    case "user-segmentation":
      pushL("Basis", data.basis);
      for (const s of data.segments ?? []) {
        const parts = [s.name, s.criteria, s.size, s.need].map(val).filter(Boolean);
        if (parts.length) push(parts.join(" — "));
      }
      pushL("Priority", data.priority);
      pushL("Risk", data.risk);
      break;
    case "root-cause":
      (data.hypotheses ?? []).forEach((h: any, i: number) => {
        if (val(h.hypothesis) || val(h.check)) push(`${i + 1}. ${val(h.hypothesis)} (data: ${val(h.check)})`);
      });
      pushL("Root cause", data.finding);
      break;
    case "opportunity-sizing":
      for (const a of data.assumptions ?? []) {
        if (val(a.label) || val(a.value)) push(`${val(a.label)}: ${val(a.value)}`);
      }
      pushL("Formula", data.formula);
      pushL("Result", data.result);
      break;
    case "hypothesis":
      (data.items ?? []).forEach((h: any, i: number) => {
        if (val(h.text) || val(h.metric)) push(`${i + 1}. ${val(h.text)} ${val(h.metric)}`);
      });
      push(val(data.notes));
      break;
    case "survey":
      pushL("Goal", data.goal);
      pushL("Respondents", data.respondents);
      (data.questions ?? []).forEach((q: any, i: number) => {
        if (val(q.text)) push(`${i + 1}. [${q.type}] ${val(q.text)}${q.options ? ` (${q.options.split("\n").join(" · ")})` : ""}`);
      });
      break;
    case "interview":
      pushL("Goals", (data.goals ?? "").split("\n").join(" · "));
      (data.questions ?? []).forEach((q: any, i: number) => {
        if (val(q.text)) push(`${i + 1}. ${q.label ? `(${q.label}) ` : ""}${val(q.text)}`);
      });
      pushL("Probes", (data.probes ?? "").split("\n").join(" · "));
      (data.avoid ?? []).forEach((a: any) => {
        if (val(a.text) || val(a.why)) push(`Avoid: “${val(a.text)}” — ${val(a.why)}`);
      });
      break;
    case "problem-framing":
      if (data.focus) push(`Focus: ${val(data.focus)}`);
      pushL("Who", data.who);
      pushL("Problem", data.problem);
      pushL("Why now", data.whyNow);
      pushL("Evidence", data.evidence);
      pushL("Impact", data.impact);
      pushL("Constraints", data.constraints);
      pushL("Success metric", data.successMetric);
      pushL("Unknowns", data.unknowns);
      break;
    case "idea-filters":
      if ((data.criteria ?? []).some(Boolean)) push(`Criteria: ${data.criteria.filter(Boolean).join(", ")}`);
      (data.rows ?? []).forEach((r: any, i: number) => {
        if (val(r.name) || (r.scores ?? []).some(Boolean)) push(`${i + 1}. ${val(r.name)}: ${(r.scores ?? []).join(" · ")}`);
      });
      pushL("Pick", data.pick);
      pushL("Reasoning", data.reasoning);
      break;
    case "metrics":
      pushL("North star", data.northStar);
      (data.inputs ?? []).forEach((m: any) => {
        if (val(m.name) || val(m.definition)) push(`Input: ${val(m.name)} — ${val(m.definition)}`);
      });
      (data.guardrails ?? []).forEach((m: any) => {
        if (val(m.name) || val(m.definition)) push(`Guardrail: ${val(m.name)} — ${val(m.definition)}`);
      });
      (data.counter ?? []).forEach((m: any) => {
        if (val(m.name) || val(m.definition)) push(`Counter: ${val(m.name)} — ${val(m.definition)}`);
      });
      break;
    case "wireframing":
      (data.screens ?? []).forEach((s: any, i: number) => {
        if (val(s.name) || val(s.parts)) push(`${i + 1}. ${val(s.name)}: ${val(s.parts).split("\n").join(" → ")}`);
      });
      break;
    case "user-flow":
      (data.steps ?? []).forEach((s: any, i: number) => {
        if (val(s.text)) push(`${i + 1}. ${s.lane ? `(${s.lane}) ` : ""}[${s.type}] ${val(s.text)}${s.branches ? ` — ${s.branches.split("\n").join(" / ")}` : ""}`);
      });
      break;
    case "case-analysis":
      (data.answers ?? []).forEach((a: string, i: number) => {
        if (val(a)) push(`${labels?.[i] ?? `Part ${i + 1}`}: ${val(a)}`);
      });
      break;
  }
  return out.filter((s) => s && s.trim().length > 0);
}

export function AnswerSummary({ schema, data, labels }: { schema: SchemaId; data: any; labels?: string[] }) {
  const lines = summarizeAnswer(schema, data, labels);
  if (lines.length === 0) return <p className="muted text-[15px]">Nothing written yet.</p>;
  return (
    <ul className="space-y-1 text-[15px] list-disc pl-5">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
