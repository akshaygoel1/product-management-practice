import type { Problem, Topic, Difficulty } from "./types";

import topicsData from "../content/topics.json";
import kpiTree from "../content/kpi-tree.json";
import causalDiagram from "../content/causal-diagram.json";
import userSegmentation from "../content/user-segmentation.json";
import rootCause from "../content/root-cause.json";
import opportunitySizing from "../content/opportunity-sizing.json";
import hypothesis from "../content/hypothesis.json";
import survey from "../content/survey.json";
import interview from "../content/interview.json";
import problemFraming from "../content/problem-framing.json";
import ideaFilters from "../content/idea-filters.json";
import metrics from "../content/metrics.json";
import wireframing from "../content/wireframing.json";
import userFlow from "../content/user-flow.json";
import combined from "../content/combined.json";

export const topics: Topic[] = topicsData as Topic[];

const byTopic: Record<string, Problem[]> = {
  "kpi-tree": kpiTree as unknown as Problem[],
  "causal-diagram": causalDiagram as unknown as Problem[],
  "user-segmentation": userSegmentation as unknown as Problem[],
  "root-cause": rootCause as unknown as Problem[],
  "opportunity-sizing": opportunitySizing as unknown as Problem[],
  hypothesis: hypothesis as unknown as Problem[],
  survey: survey as unknown as Problem[],
  interview: interview as unknown as Problem[],
  "problem-framing": problemFraming as unknown as Problem[],
  "idea-filters": ideaFilters as unknown as Problem[],
  metrics: metrics as unknown as Problem[],
  wireframing: wireframing as unknown as Problem[],
  "user-flow": userFlow as unknown as Problem[],
};

export const problems: Problem[] = [
  ...Object.values(byTopic).flat(),
  ...(combined as unknown as Problem[]),
];

export const problemMap = new Map(problems.map((p) => [p.id, p]));

export function getProblem(id: string | undefined): Problem | undefined {
  return id ? problemMap.get(id) : undefined;
}

export function problemsForTopic(topicId: string): Problem[] {
  if (topicId === "combined") return combined as Problem[];
  return byTopic[topicId] ?? [];
}

export function topicById(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function topicName(id: string): string {
  return topicById(id)?.name ?? id;
}

export const DIFFICULTIES: { value: Difficulty | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

/** Human label for the topic of a step; for singles shows the topic, for combined the step topic. */
export function problemTopicLabel(problem: Problem): string {
  if (problem.type === "single") return topicName(problem.steps[0].topic);
  return "Combined problems";
}
