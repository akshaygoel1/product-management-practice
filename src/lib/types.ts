export type Difficulty = "easy" | "medium" | "hard";

export type SchemaId =
  | "kpi-tree"
  | "causal-diagram"
  | "user-segmentation"
  | "root-cause"
  | "opportunity-sizing"
  | "hypothesis"
  | "survey"
  | "interview"
  | "problem-framing"
  | "idea-filters"
  | "metrics"
  | "wireframing"
  | "user-flow";

export interface Reference {
  content: Record<string, unknown>;
  whyItWorks?: string;
  commonMistakes?: string[];
  rubric: string[];
}

export interface Step {
  topic: string;
  task: string;
  hints: string[];
  answerSchema: SchemaId;
  showPreviousAnswer?: boolean;
  reference: Reference;
}

export interface Scenario {
  company: string;
  context: string;
  data?: { label: string; value: string }[];
}

export interface Problem {
  id: string;
  title: string;
  type: "single" | "combined";
  difficulty: Difficulty;
  estimatedMinutes: number;
  tags: string[];
  scenario: Scenario;
  steps: Step[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  answerSchema: SchemaId;
}

/* ---- per-schema answer data shapes (stored in localStorage) ---- */

export interface TreeNodeData {
  label: string;
  children: TreeNodeData[];
}
export interface KpiTreeAnswer {
  root: string;
  children: TreeNodeData[];
}

export interface EdgeData {
  cause: string;
  effect: string;
  sign: "+" | "−";
}
export interface CausalAnswer {
  edges: EdgeData[];
  loops: string;
  confounders: string;
}

export interface SegmentRow {
  name: string;
  criteria: string;
  size: string;
  need: string;
}
export interface SegmentsAnswer {
  basis: string;
  segments: SegmentRow[];
  priority: string;
  risk: string;
}

export interface RootCauseAnswer {
  hypotheses: { hypothesis: string; check: string }[];
  finding: string;
}

export interface AssumptionsAnswer {
  assumptions: { label: string; value: string }[];
  formula: string;
  result: string;
}

export interface HypothesisAnswer {
  items: { text: string; metric: string }[];
  notes: string;
}

export interface SurveyQuestionRow {
  text: string;
  type: string;
  options: string;
}
export interface SurveyAnswer {
  goal: string;
  respondents: string;
  questions: SurveyQuestionRow[];
}

export interface InterviewAnswer {
  goals: string;
  questions: { label: string; text: string }[];
  probes: string;
  avoid: { text: string; why: string }[];
}

export interface CanvasAnswer {
  focus: string;
  who: string;
  problem: string;
  whyNow: string;
  evidence: string;
  impact: string;
  constraints: string;
  successMetric: string;
  unknowns: string;
}

export interface ScoreMatrixAnswer {
  criteria: string[];
  rows: { name: string; scores: number[] }[];
  pick: string;
  reasoning: string;
}

export interface MetricSetAnswer {
  northStar: string;
  inputs: { name: string; definition: string }[];
  guardrails: { name: string; definition: string }[];
  counter: { name: string; definition: string }[];
}

export interface WireframeAnswer {
  screens: { name: string; parts: string; notes: string }[];
}

export interface FlowStepRow {
  lane: string;
  type: string;
  text: string;
  branches: string;
}
export interface FlowAnswer {
  steps: FlowStepRow[];
}

export type AnswerData =
  | KpiTreeAnswer
  | CausalAnswer
  | SegmentsAnswer
  | RootCauseAnswer
  | AssumptionsAnswer
  | HypothesisAnswer
  | SurveyAnswer
  | InterviewAnswer
  | CanvasAnswer
  | ScoreMatrixAnswer
  | MetricSetAnswer
  | WireframeAnswer
  | FlowAnswer;
