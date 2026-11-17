import { Fragment, useId, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { DIFFICULTIES } from "../lib/content";
import { useDifficulty } from "../state/DifficultyContext";
import { useProgress } from "../state/ProgressContext";
import { problems } from "../lib/content";

/* ---------- header ---------- */

export function Header({ variant }: { variant: "home" | "centered" }) {
  const { progress } = useProgress();
  const attempted = Object.keys(progress).length;
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
      <div>
        {variant === "centered" ? (
          <Link to="/" className="link text-[15px]">← Home</Link>
        ) : (
          <span />
        )}
      </div>
      <Link to="/" className="font-bold text-[17px] tracking-tight px-2">
        PM Practice Studio
      </Link>
      <div className="justify-self-end">
        {variant === "home" && (
          <Link to="/progress" className="link text-[15px]">
            Progress · {attempted} of {problems.length}
          </Link>
        )}
      </div>
    </header>
  );
}

/* ---------- difficulty chips ---------- */

export function DifficultyChips({ label = "Difficulty" }: { label?: string }) {
  const { difficulty, setDifficulty } = useDifficulty();
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Difficulty filter">
      <span className="label mr-1">{label}</span>
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          type="button"
          className={`chip ${difficulty === d.value ? "chip-active" : ""}`}
          aria-pressed={difficulty === d.value}
          onClick={() => setDifficulty(d.value)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- accordion (ARIA) ---------- */

export function Accordion({
  open,
  onToggle,
  summary,
  children,
  tint = false,
  summaryMeta,
}: {
  open: boolean;
  onToggle: () => void;
  summary: ReactNode;
  children: ReactNode;
  tint?: boolean;
  summaryMeta?: ReactNode;
}) {
  const id = useId();
  return (
    <section className={tint ? "card-tint" : "card"}>
      <div className="flex items-center gap-3 p-5">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          aria-expanded={open}
          aria-controls={`acc-${id}`}
          onClick={onToggle}
        >
          <svg
            className="shrink-0 transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "none" }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M5 3l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold">{summary}</span>
          {summaryMeta}
        </button>
        <button type="button" className="btn-small" onClick={onToggle} aria-expanded={open}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      <div id={`acc-${id}`} role="region" hidden={!open}>
        {open && <div className="px-5 pb-5">{children}</div>}
      </div>
    </section>
  );
}

/* ---------- hint stack ---------- */

export function Hints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;
  return (
    <section className="card">
      <div className="flex items-center gap-3 p-5">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ transform: shown > 0 ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
          <path d="M5 3l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-semibold">Hint</span>
        <span className="muted text-[15px]">
          {shown} of {hints.length}
        </span>
        <span className="flex-1" />
        {shown < hints.length && (
          <button
            type="button"
            className="btn-small"
            onClick={() => setShown((s) => Math.min(s + 1, hints.length))}
          >
            {shown === 0 ? "Show hint" : "Show hint " + (shown + 1)}
          </button>
        )}
      </div>
      {shown > 0 && (
        <ul className="px-5 pb-5 space-y-2" aria-live="polite">
          {hints.slice(0, shown).map((h, i) => (
            <li key={i} className="rounded-xl px-4 py-3" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
              {h}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- rubric self-check ---------- */

export function Rubric({
  items,
  checked,
  onChange,
}: {
  items: string[];
  checked: boolean[];
  onChange: (next: boolean[]) => void;
}) {
  const state = items.map((_, i) => !!checked[i]);
  const count = state.filter(Boolean).length;
  return (
    <div className="mt-5 rounded-xl p-4" style={{ background: "var(--ref-box)", border: "1px solid var(--ref-box-border)" }}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="label">Self-check rubric</span>
        <span className="font-semibold text-[15px]">
          {count}/{items.length}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex items-start gap-2 cursor-pointer text-[15px]">
              <input
                type="checkbox"
                className="mt-1 accent-[var(--accent)]"
                checked={state[i]}
                onChange={(e) => {
                  const next = [...state];
                  next[i] = e.target.checked;
                  onChange(next);
                }}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- misc ---------- */

export function DifficultyTag({ d }: { d: string }) {
  return <span className="capitalize">{d}</span>;
}

export function Breadcrumb({
  topicLabel,
  difficulty,
  minutes,
  right,
  backTo = "/topics",
}: {
  topicLabel: ReactNode;
  difficulty: string;
  minutes: number;
  right?: ReactNode;
  backTo?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 text-[15px]">
      <Link to={backTo} className="link" aria-label="Back">
        ← {topicLabel}
      </Link>
      <span aria-hidden="true">·</span>
      <span className="capitalize">{difficulty}</span>
      <span aria-hidden="true">·</span>
      <span>{minutes} min</span>
      <span className="flex-1" />
      {right}
    </div>
  );
}

export function useBackPath(): string {
  const location = useLocation();
  return (location.state?.from as string) ?? "/topics";
}

export function ProgressFooter({ text }: { text: string }) {
  return <p className="text-[13px] muted">{text}</p>;
}

export function Columns({ a, b }: { a: ReactNode; b: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Fragment>{a}</Fragment>
      <Fragment>{b}</Fragment>
    </div>
  );
}
