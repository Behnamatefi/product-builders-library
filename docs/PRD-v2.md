# PRD v2 — Redesign + Knowledge-Graph Rewrite

**Product:** The Product Builder's Library — a bilingual (English / فارسی), no-build, offline-capable static site of 45 interactive book "knowledge-graph" pages across 15 skill groups, plus an `index.html` catalog.
**Release:** v2 ("Linear × Raycast × Apple" redesign + interactive graph rewrite + English-default).
**Status:** Delivered — this is a *retrospective* PRD documenting the system as shipped on branch `claude/project-onboarding-github-00cac9` (uncommitted working tree).
**Author:** Product Manager
**Related docs:** [`feature-requests-v2.md`](feature-requests-v2.md) · [`PRD.md`](PRD.md) (v1: navigation + CMS templating) · [`feature-requests.md`](feature-requests.md) · [`../README.md`](../README.md)
**Primary files touched:** `assets/book.js` (GRAPH module + `renderShell`), `assets/book.css`, `assets/recommend.js`, `index.html`, and all 45 `NN - Group/<slug>.html` shells.

---

## 1. Overview & problem statement

v1 shipped a working system: one shared runtime (`assets/book.js` + `assets/book.css`) drives 45 content-only page shells, with library navigation and cross-page theme/language persistence. It was maintainable and complete, but three problems remained.

**P1 — The knowledge graph read as a diagram, not a product.** The interactive network lived inside a normal `.card` constrained to the 960px content column, on a small `820×560` canvas with a single circular ring (`R1`), straight-line links (`<line>`), and a static side panel. It looked like an org-chart embedded in an article. It did not invite exploration, and on wide screens it wasted most of the viewport. The graph is the marquee feature of every page, yet it had the least visual and interactive investment.

**P2 — The visual language was generic.** The palette was a teal-accent, soft-gray card system with flat shadows and serif (`Newsreader`) English headings. It was clean but undifferentiated — it did not signal "crafted software," and it had no motion vocabulary (no press feedback, no materialize transitions, no focus polish). It looked like a template, not a product a builder would be proud to share.

**P3 — Persian-first was the wrong default for the audience.** The whole site booted `data-lang="fa"`, `dir="rtl"`. The content is bilingual and stays bilingual, but the primary distribution audience (product builders sharing links, Lenny's-list readers) reaches for English first, and an English-default page is more shareable and more indexable. Persian must remain a first-class, one-tap alternative — not the forced entry point.

This PRD covers the v2 change set that resolves these: a **knowledge-graph rewrite** (P1), a **whole-surface redesign** in a Linear × Raycast × Apple language with a real motion system (P2), and an **English-default flip** across all 46 pages (P3). Content is untouched; every book stays fully bilingual.

---

## 2. Goals / non-goals

### Goals
- **G1 — Make the graph the centerpiece.** Full-viewport-width canvas, larger nodes, an inviting "explore me" surface, and direct manipulation (click a node → read it; drag to rearrange).
- **G2 — Turn selection into understanding.** Clicking a node must both *show its content* (a summary card) and *show its relationships* (drawn connector lines), so the graph teaches structure, not just topology.
- **G3 — Adopt a distinctive, coherent design language** (Linear × Raycast × Apple): near-black dark default, indigo accent, hairline borders, glass/aurora surfaces, sans display type, and a shared motion system — applied identically on book pages *and* the catalog.
- **G4 — Flip to English-default** across all 45 book shells and the catalog, with Persian preserved as a one-tap toggle and all persistence/RTL behavior intact.
- **G5 — Regress nothing from v1.** The centered-logo masthead, library nav (home/prev/next/all-books overlay), the "Find my reading path" wizard, the structured-map graph tab, the 5-stage ladder, quotes, media, and cross-page theme/language persistence must all still work.
- **G6 — Stay within the platform constraints:** no build step, no server, no runtime JS dependencies (fonts via CDN only), full EN/فارسی + LTR/RTL + light/dark, offline-capable once assets are cached.

### Non-goals
- Rewriting book **content** (the `DATA` object per page). This is a presentation + interaction release.
- A physics/force-directed graph engine. The layout stays **deterministic** (computed radial/elliptical positions, no simulation) so it is stable, dependency-free, and reproducible.
- Graph editing, saving custom layouts, deep-linking to a selected node, or exporting the graph.
- Backend, CMS server, analytics instrumentation, or A/B infrastructure.
- Reworking the recommend/wizard visual design beyond the shared token palette it already inherits.

---

## 3. Requirement 1 — Interactive graph: click a node → summary card

**What shipped.** Selecting any node (`select(id)` in the `GRAPH` module, `assets/book.js:522`) opens a floating, glassy **summary card** (`<aside class="detail" id="detailHost">`, `book.js:164`) that materializes over the graph with that item's content. The card is populated per node kind:
- **kicker** ("Core idea" / "Part · «tag»" / "Idea N"),
- **title** (`d.name`),
- **principle / big idea** (`d.principle`),
- and, when present in the data: **In depth** (`d.more`), **Example** (`d.example`), **Try this** (`d.tip`), **Watch out** (`d.pitfall`),
- plus a **Related** row of clickable chips that re-select the connected nodes (`book.js:541–551`).

The card is glass (`backdrop-filter: blur(22px) saturate(180%)`), floats top-trailing over the canvas, and animates in via `@keyframes cardIn` (fade + `translateY(-6px)` + `scale(.96)` → rest), with the transform origin flipping for RTL (`.detail` / `html[dir="rtl"] .detail`, `book.css:186–193`). On narrow screens (`≤720px`) it drops to a static block below the graph and disables the blur (`book.css:212–216`). On `build()`, `core` is auto-selected so the card is never empty.

### Acceptance criteria — AC-G1
- **AC-G1.1** Clicking any node (core, part, or chapter) opens/updates the summary card with that node's title and principle.
- **AC-G1.2** Optional rows (In depth / Example / Try this / Watch out) render **only** when that key exists in the node's data; absent keys produce no empty rows.
- **AC-G1.3** The card shows a **Related** row whose chips, when clicked, select the corresponding node (card + focus + connectors all update).
- **AC-G1.4** The card materializes with a scale+fade transition; transform-origin is top-right in LTR and top-left in RTL.
- **AC-G1.5** On load, `core` is selected by default so the card is populated before any interaction.
- **AC-G1.6** On viewports `≤720px` the card renders as a static block beneath the graph (no fixed overlay, no backdrop blur) and remains fully readable.
- **AC-G1.7** Card content is fully bilingual: labels and body switch with the language toggle and Persian text is digit/RLM-shaped.
- **AC-G1.8** Clicking empty canvas resets selection to `core` (`setupTabs` → `resetFocus`, `book.js:626`); a click that was actually a drag (moved > 4px) does **not** trigger selection (`book.js:423, 464`).

---

## 4. Requirement 2 — Full-viewport-width graph

**What shipped.** The network view container changed from `.card graphcard` (padded, inside the 960px column) to `.graphfull` (`book.js:160`), which breaks out to the full viewport width: `width:100vw; margin-inline:calc(50% - 50vw)` (`book.css:133`). The SVG canvas grew from `viewBox 820×560` to `1200×760` in the shell (`book.js:162`) and the layout computes on `W=1360, H=760` (`book.js:370`). The SVG element itself is fluid: `width:100%; height:min(72vh,720px); min-height:440px` (`book.css:148`). The surface is a rounded, bordered "stage" with a Linear-style dotted grid (`.svgwrap::before`, `book.css:145–147`), an accent radial wash, an inset highlight, a glass hint pill ("Click a node to read more · drag to move"), and a Reset button.

The layout also widened structurally: a single ring became an **ellipse** (`Rx=470, Ry=262`, `book.js:372`) that uses the extra horizontal room, and nodes grew (core `38→46`, part `25→30`, chapter `15→18`, `book.js:378–388`).

### Acceptance criteria — AC-G2
- **AC-G2.1** In the Interactive-network tab, the graph stage spans the full viewport width (edge-to-edge), not the 960px article column.
- **AC-G2.2** The graph does **not** cause the page `<body>` to scroll horizontally at desktop, tablet, or mobile widths (QA must verify `100vw` breakout does not exceed the viewport once the vertical scrollbar is accounted for).
- **AC-G2.3** The SVG scales fluidly with the viewport (via `viewBox` + `preserveAspectRatio`), keeping the whole graph visible without clipping the outermost node labels.
- **AC-G2.4** Canvas height is responsive: `min(72vh,720px)` with a `440px` floor on desktop, `66vh/380px` at `≤720px`, `420px` at `≤640px`.
- **AC-G2.5** The full-bleed section respects RTL: `margin-inline` / `inset-inline-*` are logical properties, so the breakout is symmetric in both directions.
- **AC-G2.6** The elliptical layout places all parts and chapters without overlap for the standard shape (1 core + N parts + their chapters) used across the 45 books.

---

## 5. Requirement 3 — Cross-relation connector lines

**What shipped.** Two link layers now exist. **Base structural links** are curved hairlines: each `link` renders as `<path class="glink">` (was `<line>`), shaped by `linkPath()`, a gentle quadratic Bézier with curvature `0.10` (`book.js:432–437, 402`). On selection, `drawRelations(node)` (`book.js:510–520`) injects a second set of **animated accent connectors** into a dedicated `#grel` group (`book.js:420`): for each related node it draws a `<path class="rel draw">` with curvature `0.14`, an accent stroke + glow (`book.css:180–181`), and a stroke-dashoffset **draw-in** animation (`@keyframes relDraw`, dash length set per-path via `--len`, `book.css:182–183`).

Relationships come from `relatedIds(node)` (`book.js:497–506`):
- **core →** all parts,
- **part →** all of its chapters,
- **chapter →** its parent part **and** its sibling chapters.

Focus dimming runs in parallel: `applyFocus(id)` dims unrelated nodes/links and highlights the kept set (`book.js:483–496`), so the connectors are read against a quieted background.

### Acceptance criteria — AC-G3
- **AC-G3.1** Base structural links render as **curved** paths (not straight lines) between connected nodes.
- **AC-G3.2** Selecting a node draws accent-colored curved connectors from it to exactly its related set: core→all parts; part→its chapters; chapter→its part + sibling chapters.
- **AC-G3.3** Each connector animates in via a stroke-dashoffset draw (origin at the selected node), and connectors are cleared/redrawn on the next selection.
- **AC-G3.4** On selection, unrelated nodes and base links dim and the related set is emphasized; deselecting (empty-canvas click → core) restores the full graph.
- **AC-G3.5** Connectors and base links reposition correctly when a node is dragged (both `.glink` and `.rel` are updated in `positions()`, `book.js:443–446`).
- **AC-G3.6** With `prefers-reduced-motion: reduce`, connectors appear **fully drawn** with no animation (`book.css:421`).
- **AC-G3.7** Connectors are purely presentational (`pointer-events:none`) and never intercept clicks meant for nodes or canvas.

---

## 6. Requirement 4 — Redesign brief (Linear × Raycast × Apple)

Driven by the `apple-design` language and a Linear/Raycast reference. Applied to **both** `assets/book.css` and the `index.html` inline `<style>` so the catalog and book pages read as one system.

### 6.1 Color & surface
- **Near-black dark default** `--bg:#0a0a0d`, layered cards `#141519 / #1a1c22`; refined light `#fbfbfd`.
- **Indigo accent** `--accent:#5b63e6` (light) / `#8b8fff` (dark), secondary `--accent-2:#7c5cff / #a78bff`.
- **Hairline borders** as translucent rgba (`--line: rgba(17,20,30,.09)` / `rgba(255,255,255,.09)`) rather than solid grays.
- **Elevation tokens** `--shadow` / `--shadow-lg`; a `--glow` token exists in `book.css` (see Risk R6).
- **Aurora hero:** a dark glass band in *both* themes (`linear-gradient(160deg,var(--hero-1),var(--hero-2))`) with two blurred accent/secondary radial "auroras" (`.hero::before` / `.hero::after`, `book.css:50–54`).

### 6.2 Typography
- **Inter** sans for English display headings with tight tracking, **overriding** the previous `Newsreader` serif for `h2`, stage/part/detail/media headings, blockquotes, and the library-sheet title (`book.css:402–411`, `!important` override + `letter-spacing:-.02em`). Persian keeps `Vazirmatn`.

### 6.3 Motion system
- **Shared tokens:** easing `--ease` / `--ease-out` / `--ease-io` and durations `--d1:.16s` / `--d2:.28s` / `--d3:.5s` (book.css; `index.html` carries the easings + `--d1/--d2`).
- **Press feedback** (Apple "respond on pointer-down"): `:active { transform: scale(.96) }` on buttons/controls/rungs (`book.css:42`).
- **Card hover lift** on `.card/.stagecard/.mcard` (`book.css:414–415`).
- **Materialize** transitions: `cardIn` (summary card), `relDraw` (connectors), node scale on hover/select (`book.css:163–171`).
- **Focus polish:** `:focus-visible` accent ring (`book.css:43`).

### 6.4 Accessibility of the aesthetic
- `@media (prefers-reduced-motion: reduce)` neutralizes animations/transitions and forces connectors fully drawn (`book.css:418–422`; `index.html` has the motion clamp inline).
- `@media (prefers-reduced-transparency: reduce)` swaps glass surfaces for solid `--card` (`book.css:423–426`).

### Acceptance criteria — AC-D
- **AC-D1** Book pages and `index.html` share the same token palette (accent, bg, card, line, shadow, motion), verified by matching `:root` / `[data-theme="dark"]` values.
- **AC-D2** Dark is a true near-black (`#0a0a0d`), not a dark-blue-gray; the accent is indigo, not teal, everywhere.
- **AC-D3** The hero is a dark aurora band in **both** light and dark themes on both the catalog and book pages.
- **AC-D4** English headings render in Inter (sans) with tight tracking; no English heading falls back to the old serif. Persian renders in Vazirmatn.
- **AC-D5** Interactive controls visibly depress (`scale .96`) on press and show an accent focus ring on keyboard focus.
- **AC-D6** With `prefers-reduced-motion: reduce`, no animation or transition plays and the connector draw is instant.
- **AC-D7** With `prefers-reduced-transparency: reduce`, the nav, summary card, hint, and reset controls become opaque.
- **AC-D8** Light and dark are both styled and legible on every section (theme is viewer-controlled and persists across pages).

---

## 7. Requirement 5 — English-default flip

**What shipped.** Every page now boots English/LTR while remaining fully bilingual:
- All **45** book shells: `<html lang="en" dir="ltr" data-lang="en">` and pre-paint boot fallback `localStorage.getItem('pbl-lang') || 'en'` (verified 45/45; 0 remaining `'fa'` fallbacks).
- `index.html`: same `<html>` attributes and boot fallback (`index.html:3, 17`).
- Runtime fallbacks flipped to `'en'`: `book.js:29` and `book.js:682`, `recommend.js:20`, and the `index.html` inline `LANG` (`index.html:260`).
- A returning visitor's stored `pbl-lang` still wins; the language toggle and `setLang()` still write `pbl-lang` and flip `lang`/`dir` live.

### Acceptance criteria — AC-EN
- **AC-EN1** With no stored preference, every one of the 45 book pages **and** the catalog load in English/LTR.
- **AC-EN2** A stored `pbl-lang=fa` still boots Persian/RTL before first paint (no flash of the wrong direction).
- **AC-EN3** The language toggle switches EN↔FA live on every page and persists across navigation via `pbl-lang`.
- **AC-EN4** No page retains a Persian-default fallback in markup or scripts (`|| 'fa'` fully removed from shells, `book.js`, `recommend.js`, `index.html`).
- **AC-EN5** Persian content is unchanged and fully reachable; RTL layout is correct when Persian is active.

---

## 8. Success metrics

Because there is no analytics backend (non-goal), these are the intended outcomes and how they'd be judged. Instrumentation is a follow-up (see `feature-requests-v2.md`, Section B).

| # | Metric | Target / signal |
|---|---|---|
| M1 | **Graph engagement** | ≥ 60% of book-page sessions select at least one node beyond the default `core`. |
| M2 | **Exploration depth** | Median ≥ 3 node selections per engaged session (chip-driven traversal counts). |
| M3 | **Full-width correctness** | 0 pages with horizontal body scroll across desktop/tablet/mobile in QA. |
| M4 | **Design coherence** | 100% token parity between `book.css` and `index.html`; 0 English headings rendering in the old serif. |
| M5 | **English-default reach** | 100% of pages boot EN/LTR with no stored preference (mechanically verifiable). |
| M6 | **No regressions** | All v1 acceptance criteria (nav, overlay, wizard, persistence, ladder, tabs) still pass. |
| M7 | **Accessibility floor** | Reduced-motion and reduced-transparency honored; keyboard focus visible; contrast ≥ WCAG AA on text (subject to the node-keyboard gap in R2). |

---

## 9. Risks & known issues

| # | Risk / issue | Evidence | Severity | Mitigation |
|---|---|---|---|---|
| R1 | **Graph nodes are not keyboard-operable.** Nodes are SVG `<g>` with `pointerdown`/`click` only — no `tabindex`, `role`, or `keydown`. Keyboard/switch/screen-reader users cannot select nodes or reach the summary card. | `book.js:421–426` (no a11y attrs); grep: no `tabindex`/`role="button"`/node `keydown`. | High (a11y) | Add roving-tabindex + `role="button"` + Enter/Space handlers to nodes; consider a text/list fallback (the Structured-map tab partially covers this). |
| R2 | **Summary card is not announced.** `#detailHost` has no `aria-live`; content swaps silently on select. | grep: no `aria-live` in `book.js`. | Medium (a11y) | Mark `.detail` as a polite live region, or move focus into the card on open. |
| R3 | **`100vw` full-bleed can trigger horizontal scroll** when a vertical scrollbar is present (`100vw` includes scrollbar width). | `book.css:133` `.graphfull{width:100vw;margin-inline:calc(50% - 50vw)}`. | Medium | QA across scrollbar-present browsers; if it bleeds, clamp with `100%`+JS or `overflow-x:clip` on an ancestor. |
| R4 | **`prefers-reduced-transparency` not handled on the catalog.** Only `book.css` has the query; `index.html`'s glass nav stays translucent for those users. | grep: 0 hits in `index.html`. | Low | Add the same media query to the `index.html` inline style. |
| R5 | **Motion-token drift between files.** `index.html` defines `--d1/--d2` + easings but not `--d3`; `book.css` defines `--d3`. Any catalog rule using `--d3` would be undefined. | `book.css:14,28` vs `index.html:44,56`. | Low | Keep the token block identical across files, or drop unused tokens. |
| R6 | **Dead token `--glow`.** Defined in `book.css` (`:root`/dark) but referenced nowhere. | grep: no `var(--glow)` usage. | Low (cleanup) | Remove, or wire it into node-select/hero focus glow as intended. |
| R7 | **`recommend.css` lacks its own reduced-motion/focus-visible rules.** The wizard inherits the shared token palette but not the v2 motion-a11y treatment. | grep: 0 `prefers-reduced-motion`/`focus-visible` in `recommend.css`. | Low | Extend the a11y media queries to the wizard, or confirm the global `book.css`/inline clamp covers it in context. |
| R8 | **YouTube thumbnails are a third-party runtime dependency** (`i.ytimg.com`), with an `onerror` hide as the only fallback. Offline/blocked networks show no thumbnail. | `book.js:294–298`. | Low (pre-existing) | Acceptable; documented. Consider a local placeholder. |

---

## 10. Open questions

1. Should node selection be **deep-linkable** (URL hash) so a shared link opens a specific concept? (Currently selection is ephemeral.)
2. Do we want a visible **close** affordance on the desktop summary card, or is empty-canvas-click discoverable enough (backed by the hint pill)?
3. Is the elliptical layout robust for future books with unusually many chapters per part, or do we need a per-book `span`/`R2` override path (the code still reads `gp.R2`/`gp.span` but ignores `gp.W/H/R1`)?
4. Should English-default also change the default **theme** heuristic, or is `prefers-color-scheme` still the right first signal? (Unchanged in v2.)
