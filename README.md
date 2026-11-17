# PM Practice Studio

Practise core PM thinking skills on realistic, pre-written problems. Pick **Random** or **Choose a topic**, work the problem out your way in structured answer fields, then unfold the hidden reference answer and self-check rubric to compare.

- 51 problems: 13 skills × 3 problems each, plus 12 combined problems that chain 2–4 skills
- All content ships as static JSON (`src/content/`), validated at build time (`npm run validate:content`, schema in `schema/content-schema.json`)
- No backend, no accounts — progress and answers live in `localStorage` (`pmps:progress`, `pmps:answers:<problemId>:<stepIndex>`)
- Difficulty filter (Any / Easy / Medium / Hard), Skip in random mode, hints revealed one at a time, side-by-side compare on desktop, light/dark via system preference

## Stack

React + TypeScript + Vite, Tailwind CSS v4, React Router. Tests with Vitest (`npm test`).

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # validates content, type-checks, builds to dist/
npm test           # unit tests (random selection, content shape)
```

## Routes

`/` home · `/topics` topic grid · `/topics/:topicId` problem list · `/problem/:problemId` problem screen · `/random` random pick · `/progress` progress dashboard
