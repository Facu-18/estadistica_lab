# Statistics Lab · IEFI

A local, interactive statistics and probability laboratory for the IEFI presentation at Instituto Técnico Superior Córdoba. Four sections: descriptive statistics with histogram, probability without repetition, an interactive graph builder/analyzer, and teacher profiles. The calculators and the graph canvas start empty: users enter all observations, elements, events and statements themselves. The interface and teacher-accompanied explanations are in Spanish. No backend, accounts, database, remote fonts or runtime services.

## Run locally

Requires **Node.js 22.12+ or 24 LTS** and npm. Dependencies need internet access only during installation.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally **http://127.0.0.1:5173**). Stop with Ctrl+C.

```sh
npm test          # Vitest unit and React interaction tests
npm run build    # Strict TypeScript check + production bundle in dist/
npm run preview  # Serve the production build locally, normally port 4173
```

The built application is static. Use an HTTP server rather than opening `dist/index.html` directly. Once installed, development, tests, builds and the application work without external services. The theme preference is the only localStorage value; datasets, events and their statements live in memory and reset on reload.

## Using the calculator

1. **Statistics:** enter your observations to obtain the count, mean, exact median, all modes, minimum, maximum and sorted frequency table. No sample data or example loader is included.
2. Switch absolute/relative frequencies or choose grouped intervals for the histogram. Adjust interval count and export the graph with **PNG**. Grouping the graph does not change the exact raw-data median.
3. Use the **Media aritmética**, **Mediana** and **Moda** help buttons. Each opens an accessible dialog with its teacher. Mean help contains the requested weighted formula and three steps; median help describes ascending order and the exact odd/even procedure; mode help uses the supplied explanation verbatim. The calculation functions remain unchanged, including the dictionary-based implementation.
4. **Probability:** enter your named elements, configure k and choose whether order matters. The app always selects without repetition. There are no preloaded elements, events or scenarios.
5. Create your events and optionally enter a separate **Enunciado del evento** for each one. It is plain reference text, not an automatic solver: selecting favorable outcomes is still manual. Probabilities are always computed with Laplace's rule, assuming equally likely outcomes (there is no confirmation checkbox). Select all for a certain event or none for an impossible event. Compare two events using the intersection panel. Changing the experiment clears events and their statements.
6. Probability keeps only three key help dialogs: sample-space cardinality, each event's procedure (including its classification) and the intersection. Other guidance is short plain text.
7. **Graphs:** a study-oriented section. Choose a graph type (*Sorpresa*, *Árbol*, *Ciclo*, *Completo*, *Con ciclos*) and 4–8 nodes, then **Generar grafo**. The panel lists its characteristics with ✓/✗ and a one-line explanation: connected, tree, cycles, complete Kn and n-cube when applicable. It also shows each g(v) and a collapsible adjacency matrix. Tap two nodes to mark the shortest path; when the graph has an Euler circuit/trail (every edge once), **Marcar camino** marks it with the edge order. Nodes can be dragged to untangle the drawing. The section starts empty and keeps the graph while navigating, not across reloads.
8. **Teachers:** meet Facundo Moriconi and Franco Aguirre through locally bundled vector illustrations. Contextual help buttons open teacher dialogs for algorithm explanations, chart descriptions, procedures, classifications, set comparisons, guidance and the quick guide. Close with the close button, Escape or the backdrop; focus returns to the opening button. Background controls cannot receive focus while a modal is open. Lessons are software content, not real quotations from the teachers.

Statements are independent per event. Editing text does not change its favorable outcomes, classification or probability. Text survives outcome toggles, select-all/empty, comparison changes and navigation—including the teacher section. Deleting an event deletes its statement; changing experiment elements/k/order or clearing the experiment resets all events. Reloading the page clears all in-memory text.

Teacher illustrations in `src/assets/teachers/` are genuine traced SVG paths, not SVG wrappers around embedded PNGs. Their exterior is transparent, including Facundo's former black background. Original supplied files are unchanged; optimized PNG authoring sources remain in the project but are not imported by the app. The vectors use simplified colors and curves, so they are stylized approximations of the original textured art. No desktop paths, remote images or tracing libraries are needed to run/build the application. No biographies or credentials beyond the supplied context are invented.

The visual theme uses cream/parchment, ochre, espresso and secondary navy tones from the portraits. Rounded local Trebuchet/Aptos/Segoe fonts and Georgia/Cambria headings keep the interface offline; available fonts vary by operating system. Both light and dark themes use the warm palette.

Help uses the browser's native `<dialog>` in a React portal. Use a current browser supporting `HTMLDialogElement.showModal()`. Dialogs support native keyboard containment, Escape, explicit close and focus return. Help next to checkbox controls is outside their labels and does not alter their values.

## Mathematical conventions and limits

| Area | Behavior |
| --- | --- |
| Numeric input | Commas, spaces and newlines separate observations. **Use a dot as the decimal separator.** Signs and scientific notation are accepted; malformed tokens invalidate the dataset rather than being silently discarded. |
| Statistics | Up to 5,000 finite observations, each with absolute value ≤ 10¹². Input order is never mutated. Mean uses compensated summation of distinct-value × frequency terms; calculations use JavaScript double precision and round only for display. |
| Exact median | Sort a copy of the original observations; use the middle observation for odd N, or the arithmetic average of the two middle observations for even N. No grouped-interval interpolation is used. |
| Mode | All values sharing the highest repeated frequency are returned. A sample of distinct values is treated as amodal; a singleton has that value as its mode. |
| Frequencies | Relative frequency = fi/N; cumulative relative frequency = Fi/N. Relative display: four decimals; percentages: two decimals. Individually rounded percentages may not sum to exactly 100%. |
| Histogram | Explicit discrete/grouped selector. Equal-width contiguous intervals, left-closed/right-open except the final interval, which includes the maximum. A constant sample uses one degenerate interval. The displayed frequency table remains the exact ungrouped table. |
| Experiments | Up to 40 named elements and k = 1…12. Repeated names receive visible index suffixes, while internal IDs identify distinct objects. Results use separators to avoid ambiguous concatenated initials. |
| Enumeration | Exact cardinalities use BigInt. Spaces above 400 outcomes are **not partially enumerated**; their exact size and an explanation are shown. Event creation is disabled until the full space can be enumerated. |
| Events | Up to eight simultaneous events, each a subset of the current space, with an optional independent plain-text statement. Changing elements, k or ordering clears events and statements. Navigating sections preserves datasets, events and statements. |
| Laplace | P(A) = \|A\|/\|Ω\| with a nonempty fully enumerated space, always assuming equally likely outcomes (stated in the UI). Unequal outcome weights are deliberately not implemented. |
| No repetition | Each distinct element can be selected at most once. Repeated names still identify distinct elements through their IDs; this is different from selecting the same element twice. |
| Classification | Empty = impossible; full space = certain; one outcome = simple; two or more = compound. Labels may overlap (certain/simple for a singleton universe). |

| Random graphs | Simple undirected graphs. Tree: random parent per node, layered layout without crossings. Ciclo: Cn on a circle. Completo: Kn on a circle. Con ciclos: random ring and chords on a circle (may be disconnected). Sorpresa picks one of these families at random. |
| Characteristics | Tree = connected with S = N − 1. Cycles: S − N + C > 0. Bipartite: BFS two-colouring. Plane = the current drawing has no crossings; with crossings, S > 3N − 6 or (triangle-free) S > 2N − 4 proves non-planarity. Euler regions N − S + R = 2 only for connected crossing-free drawings. Eulerian: edges in one component and 0 (circuit) or 2 (trail) odd-degree vertices; the trail is built with Hierholzer. Shortest path: BFS, d(u,v) in edges. |

## Statistical algorithms used in the software

- **Arithmetic mean:** build a numeric dictionary with each observed value as the key and its count as the value. Multiply each distinct value by its frequency, sum those products, then divide by N. This implements the requested formula x̄ = (x₁f₁ + x₂f₂ + …) / N, not an unweighted mean of distinct values.
- **Exact median:** the implementation sorts the observations and sets `middle = Math.floor(N / 2)`. It returns `sorted[middle]` when N is odd, or `(sorted[middle - 1] + sorted[middle]) / 2` when N is even. Histogram intervals never replace the source observations.
- **Mode:** `frequencyDictionary` returns `Map<number, number>`, a numeric key-value dictionary. `modes` finds the highest count, filters entries by that count and returns their sorted keys. This is the same selection idea as querying dictionary entries with a maximum-frequency condition. The frequency table and weighted mean reuse this dictionary builder.

The same mathematical algorithms remain in use. The latest requested mean lesson displays the weighted formula inside its help dialog; median and mode lessons are textual. Implementation details such as the frequency dictionary remain documented here rather than replacing the requested teaching copy.

App cardinality formulas, with n elements and selection size k:

- Ordered, no repetition: n!/(n−k)! (zero when k > n).
- Unordered, no repetition: C(n,k).

Pure combinatorial helpers retain unit-tested repetition support for mathematical reuse, but it is not exposed by app state or controls. The UI passes `repetition: false` explicitly.

## Code map

```text
src/
  components/           Shared educational UI and adapted shadcn/ui primitives
  features/statistics/  Descriptive statistics, frequency table and histogram
  features/charts/      Native histogram SVG-to-PNG export
  features/probability/ Manual sample-space controls, events and intersection
  features/graphs/      Generator controls, SVG graph view and study panel
  features/teachers/    Teacher metadata and presentation section
  assets/teachers/      Path-based SVG portraits and PNG authoring sources
  lib/math/             Pure TypeScript calculations and unit tests
  lib/graph/            GraphEngine (classification, matrix, degrees, BFS, Euler), drawing geometry and random graph generator
  lib/format.ts         Spanish number formatting (presentation only)
  types/                Shared domain types
  App.tsx               Navigation, in-memory state and theme
  App.test.tsx          Public-interface interaction tests
```

Stack: React, TypeScript, Vite, Tailwind CSS v4, adapted shadcn/ui Button/Card, Radix Slot, Recharts and Lucide. shadcn/ui source components are owned locally; their MIT attribution is in `THIRD_PARTY_NOTICES.md`. PNG export uses native SVG serialization and Canvas, without extra screenshot libraries.

## Verification notes

- Vitest covers dictionary frequencies, weighted arithmetic mean, exact median, mode ties, accumulated frequencies, empty/invalid input, histogram endpoints, pure combinatorial modes, enumeration limits, collision-free IDs, Laplace validation, simplified fractions, event classification, intersections and presentation rounding.
- React Testing Library covers empty startup, absence of removed sections/example/repetition controls, recalculation, invalid input, exact help copy and teacher identity, modal opening/closing and focus return, checkbox-help isolation, manual events and statement persistence/reset. Structural SVG tests reject embedded raster images and active content. JSDOM uses a narrow native-dialog test shim; actual Escape, inert focus behavior, image transparency, responsive dialogs, chart rendering and PNG downloads require browser checks.
- Production builds may report Vite's advisory that the chart-containing JavaScript bundle exceeds 500 kB. This is not a compilation failure; all runtime assets are bundled locally.
- The supplied workspace is not a Git repository, so commit-based differential checks and Git-based native review are unavailable. Local source copies can still verify unchanged math and export implementations. Nothing is committed or published.

## Deliberately excluded

Preloaded datasets, sample loaders, pie charts, repetition controls, authentication, database, backend, weighted-probability solvers, external services and persistent datasets. This is an educational MVP, not an arbitrary-precision or professional statistical analysis package.
