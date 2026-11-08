# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Offline educational statistics & probability lab ("Statistics Lab · IEFI", Instituto Técnico Superior Córdoba). React 19 + TypeScript + Vite 8 + Tailwind v4 + adapted shadcn/ui + Recharts + Lucide. No backend, auth, database, remote fonts or runtime services. UI copy is Spanish (Rioplatense voseo, e.g. "ingresá"); code, identifiers and docs are English.

## Commands

Requires Node.js 22.12+ or 24 LTS.

```sh
npm ci
npm run dev                 # Vite at http://127.0.0.1:5173
npm test                    # vitest run (all src/**/*.test.{ts,tsx})
npx vitest run src/lib/math/statistics.test.ts   # single file
npx vitest run -t "median"  # tests matching a name
npm run build               # tsc -b (strict typecheck) + vite build → dist/
npm run preview             # serve dist/ at port 4173
```

No linter or formatter is configured. A Vite warning about the >500 kB chart bundle is advisory, not a failure.

## Architecture

- `src/App.tsx` owns all cross-section state (active section, statistics input text, probability `experiment`, theme). Sections are tabs: Statistics, Probability, Teachers. State lives in memory so it survives tab navigation but resets on reload; the theme (`statistics-lab-theme`) is the only `localStorage` value.
- `src/lib/math/` holds pure, UI-free calculations — the mathematical contract the UI and tests depend on:
  - `statistics.ts`: `parseData` (commas/spaces/newlines; dot decimal; malformed tokens invalidate the whole dataset; limits `MAX_OBSERVATIONS`, `MAX_MAGNITUDE`), `frequencyDictionary` (`Map<value, count>`) reused by `mean` (weighted, compensated summation), `modes` (all max-frequency keys; all-distinct = amodal) and `frequencyTable`; `median` is exact (no grouped interpolation); `histogram` uses equal-width left-closed intervals with the last one closed.
  - `probability.ts`: BigInt `cardinality`, `generateSpace` (no partial enumeration above `ENUMERATION_LIMIT` = 400), Laplace `classicProbability` (the UI always passes `equiprobable = true`; the user removed the confirmation checkbox), `intersection`, `classifyEvent`. Combinatorial helpers keep repetition support for reuse, but the app always passes `repetition: false` — never expose repetition in UI/state.
- `src/lib/graph/GraphEngine.ts` holds all graph math (classification: tree, cycles, Kn, bipartite, regular, planarity/Euler regions, Eulerian trail via Hierholzer, Qn; adjacency matrix, degrees/handshake, BFS/Dijkstra). It still supports directed/weighted edges although the UI only generates simple undirected graphs. `generators.ts` builds random graphs per family with crossing-free layouts where possible; `geometry.ts` computes edge shapes shared by the SVG and crossing detection. `features/graphs/Graphs.tsx` owns state and calls the engine; `GraphCanvas.tsx`/`GraphResults.tsx` only render. The user asked for this section to stay simple and study-oriented (no manual drawing tools).
- `src/features/<area>/` contains each section's UI; `features/charts/export.ts` exports the histogram via native SVG serialization + Canvas (no screenshot libs).
- Teacher accompaniment: every educational explanation is wrapped in `TeacherExplanation` / `TeacherHint` (`src/components/TeacherExplanation.tsx`) or `Procedure` (`shared.tsx`), which open a native `<dialog>` via React portal attributed to a teacher id from `features/teachers/data.ts` (`facundo` | `franco`). Lessons are software-written guidance, not real quotes.
- Probability events each carry an optional plain-text `statement` that is independent of favorable outcomes; changing elements/k/order resets events and statements.
- `src/lib/format.ts` does Spanish display formatting only; round for display only, never inside calculations (relative frequencies 4 decimals, percentages 2).

## Testing

- Vitest default environment is `node`; React tests opt in with `// @vitest-environment jsdom` at the top of the file.
- `App.test.tsx` mocks `recharts` and shims `HTMLDialogElement.showModal/close` (JSDOM lacks them). Test through the public interface (Testing Library).
- `src/features/teachers/portraits.test.ts` enforces that teacher SVGs are path-based (no embedded raster images or active content).
- Real dialog focus/Escape behavior, chart rendering and PNG downloads need browser checks.

## Constraints

- Both calculators must start empty: no preloaded datasets, sample loaders, scenarios or pie charts.
- The exact Spanish help copy for mean/median/mode was supplied by the user — don't reword it.
- Probability intentionally keeps only three help dialogs (user found too many annoying); use `plain` on `SectionHeading`/`EmptyState` for plain text.
- Work logs and specs (with verbatim user requirements) live in `odd/tasks/`.
- The workspace is not a Git repository.
