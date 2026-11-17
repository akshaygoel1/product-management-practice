#!/usr/bin/env node
/**
 * Build-time content validation (PRD section 8).
 * Fails the build if any problem is malformed.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "src", "content");

const errors = [];
const fail = (msg) => errors.push(msg);

const SCHEMAS = new Set([
  "kpi-tree",
  "causal-diagram",
  "user-segmentation",
  "root-cause",
  "opportunity-sizing",
  "hypothesis",
  "survey",
  "interview",
  "problem-framing",
  "idea-filters",
  "metrics",
  "wireframing",
  "user-flow",
]);

const topicFiles = readdirSync(contentDir).filter((f) => f.endsWith(".json") && f !== "topics.json" && f !== "combined.json");
const topics = JSON.parse(readFileSync(join(contentDir, "topics.json"), "utf8"));
const TOPIC_IDS = new Set(topics.map((t) => t.id));
if (topics.length !== 13) fail(`Expected 13 topics, found ${topics.length}`);
for (const t of topics) {
  if (!SCHEMAS.has(t.answerSchema)) fail(`Topic ${t.id}: unknown answerSchema ${t.answerSchema}`);
}

const EXPECTED_MINUTES = { easy: 10, medium: 15, hard: 25 };

const problems = [];
for (const file of topicFiles) {
  const arr = JSON.parse(readFileSync(join(contentDir, file), "utf8"));
  if (!Array.isArray(arr)) fail(`${file}: not an array`);
  const topicId = file.replace(".json", "");
  if (!TOPIC_IDS.has(topicId)) fail(`${file}: topic id ${topicId} not in topics.json`);
  if (arr.length !== 3) fail(`${file}: expected 3 problems, found ${arr.length}`);
  const diffs = arr.map((p) => p.difficulty).sort().join(",");
  if (diffs !== "easy,hard,medium") fail(`${file}: difficulty mix should be easy, medium, hard — got ${diffs}`);
  for (const p of arr) {
    p._src = file;
    problems.push(p);
  }
}

const combined = JSON.parse(readFileSync(join(contentDir, "combined.json"), "utf8"));
if (combined.length !== 12) fail(`combined.json: expected 12 problems, found ${combined.length}`);
for (const p of combined) {
  p._src = "combined.json";
  problems.push(p);
}

const ids = new Set();
for (const p of problems) {
  const src = p._src;
  if (!p.id || typeof p.id !== "string") fail(`${src}: problem without id`);
  if (ids.has(p.id)) fail(`${src}: duplicate id ${p.id}`);
  ids.add(p.id);
  if (!p.title) fail(`${p.id}: missing title`);
  if (p.type !== "single" && p.type !== "combined") fail(`${p.id}: type must be single or combined`);
  if (!["easy", "medium", "hard"].includes(p.difficulty)) fail(`${p.id}: bad difficulty ${p.difficulty}`);
  if (!Array.isArray(p.tags) || p.tags.length === 0) fail(`${p.id}: tags missing`);
  if (!p.scenario || typeof p.scenario.company !== "string" || typeof p.scenario.context !== "string" || !p.scenario.context.trim())
    fail(`${p.id}: scenario needs company and context`);

  // steps
  if (!Array.isArray(p.steps) || p.steps.length === 0) {
    fail(`${p.id}: steps missing`);
    continue;
  }
  if (p.type === "single" && p.steps.length !== 1) fail(`${p.id}: single problems must have exactly 1 step`);
  if (p.type === "combined" && (p.steps.length < 2 || p.steps.length > 4)) fail(`${p.id}: combined problems must have 2 to 4 steps`);
  const expectedMinutes = p.type === "combined" ? (p.steps.length === 2 ? 30 : 45) : EXPECTED_MINUTES[p.difficulty];
  if (p.estimatedMinutes !== expectedMinutes) fail(`${p.id}: estimatedMinutes ${p.estimatedMinutes}, expected ${expectedMinutes}`);

  p.steps.forEach((s, i) => {
    if (!TOPIC_IDS.has(s.topic)) fail(`${p.id} step ${i + 1}: unknown topic ${s.topic}`);
    if (!s.task || !s.task.trim()) fail(`${p.id} step ${i + 1}: missing task`);
    if (!Array.isArray(s.hints) || s.hints.length < 1) fail(`${p.id} step ${i + 1}: needs at least one hint`);
    if (!SCHEMAS.has(s.answerSchema)) fail(`${p.id} step ${i + 1}: unknown answerSchema ${s.answerSchema}`);
    const ref = s.reference;
    if (!ref || typeof ref !== "object") {
      fail(`${p.id} step ${i + 1}: missing reference`);
      return;
    }
    if (!ref.content || typeof ref.content !== "object") fail(`${p.id} step ${i + 1}: reference.content missing`);
    if (!Array.isArray(ref.rubric) || ref.rubric.length < 3) fail(`${p.id} step ${i + 1}: rubric needs 3+ items`);
    if (p.type === "single") {
      if (!ref.whyItWorks) fail(`${p.id}: single problems need whyItWorks`);
      if (!Array.isArray(ref.commonMistakes) || ref.commonMistakes.length === 0) fail(`${p.id}: single problems need commonMistakes`);
    }
  });

  // per-schema content shape spot checks
  const c = p.steps[0].reference?.content ?? {};
  const schema = p.steps[0].answerSchema;
  switch (schema) {
    case "kpi-tree":
      if (!c.root?.label) fail(`${p.id}: kpi-tree content needs root.label`);
      break;
    case "causal-diagram":
      if (!Array.isArray(c.edges) || c.edges.length === 0) fail(`${p.id}: causal-diagram content needs edges`);
      if (!Array.isArray(c.confounders)) fail(`${p.id}: causal-diagram content needs confounders`);
      break;
    case "user-segmentation":
      if (!c.basis) fail(`${p.id}: user-segmentation content needs basis`);
      if (!Array.isArray(c.segments) || c.segments.length < 3) fail(`${p.id}: user-segmentation content needs 3+ segments`);
      if (!c.priority?.name) fail(`${p.id}: user-segmentation content needs priority`);
      break;
    case "root-cause":
      if (!Array.isArray(c.hypotheses) || c.hypotheses.length === 0) fail(`${p.id}: root-cause content needs hypotheses`);
      if (!c.finding) fail(`${p.id}: root-cause content needs finding`);
      break;
    case "opportunity-sizing":
      if (!Array.isArray(c.assumptions) || c.assumptions.length === 0) fail(`${p.id}: opportunity-sizing content needs assumptions`);
      if (!c.formula || !c.result) fail(`${p.id}: opportunity-sizing content needs formula and result`);
      break;
    case "hypothesis":
      if (!Array.isArray(c.items) || c.items.length === 0) fail(`${p.id}: hypothesis content needs items`);
      break;
    case "survey":
      if (!c.goal || !c.respondents) fail(`${p.id}: survey content needs goal and respondents`);
      if (!Array.isArray(c.questions) || c.questions.length === 0) fail(`${p.id}: survey content needs questions`);
      break;
    case "interview":
      if (!Array.isArray(c.questions) || c.questions.length === 0) fail(`${p.id}: interview content needs questions`);
      break;
    case "problem-framing":
      if (!c.who || !c.problem || !c.successMetric) fail(`${p.id}: problem-framing content needs who, problem, successMetric`);
      break;
    case "idea-filters":
      if (!Array.isArray(c.criteria) || c.criteria.length === 0) fail(`${p.id}: idea-filters content needs criteria`);
      if (!Array.isArray(c.ideas) || c.ideas.length === 0) fail(`${p.id}: idea-filters content needs ideas`);
      if (!c.pick) fail(`${p.id}: idea-filters content needs pick`);
      break;
    case "metrics":
      if (!c.northStar) fail(`${p.id}: metrics content needs northStar`);
      if (!Array.isArray(c.guardrails)) fail(`${p.id}: metrics content needs guardrails`);
      break;
    case "wireframing":
      if (!Array.isArray(c.screens) || c.screens.length === 0) fail(`${p.id}: wireframing content needs screens`);
      break;
    case "user-flow":
      if (!Array.isArray(c.steps) || c.steps.length === 0) fail(`${p.id}: user-flow content needs steps`);
      break;
  }
}

const singles = problems.filter((p) => p.type === "single").length;
const combos = problems.filter((p) => p.type === "combined").length;
if (singles !== 39) fail(`Expected 39 single problems, found ${singles}`);
if (combos !== 12) fail(`Expected 12 combined problems, found ${combos}`);

if (errors.length > 0) {
  console.error(`\nContent validation FAILED (${errors.length} problem${errors.length > 1 ? "s" : ""}):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ Content OK: ${problems.length} problems (39 single + 12 combined), 13 topics, all schemas valid.`);
