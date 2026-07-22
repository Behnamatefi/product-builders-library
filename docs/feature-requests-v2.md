# Feature Requests & Backlog — v2

Itemized record for the v2 release of **The Product Builder's Library** (redesign + knowledge-graph rewrite + English-default). **Section A** documents the changes shipped on this branch as user stories with detailed acceptance criteria (a done-log / requirements record). **Section B** is the follow-up backlog.

Legend — personas: **Reader** (browses and learns), **Content editor** (authors/edits a book's `DATA`), **Maintainer** (owns shared UI + tooling).
Companion doc: [`PRD-v2.md`](PRD-v2.md). v1 history: [`PRD.md`](PRD.md) · [`feature-requests.md`](feature-requests.md).

---

## A. Shipped features (done-log)

### A1 — Click a node to read its summary
**As a Reader,** I want to click any node in the knowledge graph and immediately read what it means, so the graph teaches me instead of just showing shapes.
- **AC1** Clicking any node (core, part, or chapter) opens a floating **summary card** populated for that node. *(`select`, `book.js:522`; `#detailHost` = `<aside class="detail">`, `book.js:164`.)*
- **AC2** The card shows a kicker (Core idea / Part · tag / Idea N), the title, and the principle/big-idea for that node.
- **AC3** Optional rows render only when the underlying data key exists: **In depth** (`more`), **Example** (`example`), **Try this** (`tip`), **Watch out** (`pitfall`). No empty rows for missing keys. *(`book.js:537–540`.)*
- **AC4** The core node is auto-selected on load, so the card is never empty before interaction. *(`build()` → `select('core')`, `book.js:396`.)*
- **AC5** Clicking empty canvas returns selection to `core` and clears the focus/relations. *(`setupTabs` svg click → `resetFocus`, `book.js:626`.)*
- **AC6** A press that turns into a drag (moved > 4px) does **not** open/select a node. *(`moved` guard, `book.js:423, 464`.)*
- **AC7** All card text is bilingual and switches with the language toggle; Persian is digit- and RLM-shaped.
- **AC8** On viewports `≤720px`, the card renders as a static block **below** the graph (no fixed overlay, no backdrop blur) and stays readable. *(`book.css:212–216`.)*

### A2 — Materializing glass summary card
**As a Reader,** I want the summary card to feel like a crafted surface that appears in place, so selecting a node feels responsive and physical.
- **AC1** The card is a glass surface: translucent card background with `backdrop-filter: blur(22px) saturate(180%)`. *(`book.css:188–189`.)*
- **AC2** It animates in with fade + slight rise + scale (`@keyframes cardIn`: `translateY(-6px) scale(.96)` → rest). *(`book.css:191–193`.)*
- **AC3** Transform-origin is top-right in LTR and top-left in RTL. *(`.detail` + `html[dir="rtl"] .detail`, `book.css:191–192`.)*
- **AC4** It floats top-trailing over the canvas without covering the whole graph (`width: min(340px,42%)`, scrollable if tall). *(`book.css:186–187`.)*
- **AC5** Under `prefers-reduced-transparency: reduce`, the card becomes opaque `--card`. *(`book.css:423–426`.)*
- **AC6** Under `prefers-reduced-motion: reduce`, the entrance animation is neutralized. *(`book.css:418–420`.)*

### A3 — Related chips traverse the graph
**As a Reader,** I want the card to list related concepts I can click, so I can walk the book's structure by topic instead of hunting on the canvas.
- **AC1** The card ends with a **Related** row of chips, one per related node, each with its color swatch and name. *(`book.js:541–546`.)*
- **AC2** Clicking a chip selects that node — card, focus dimming, and connectors all update. *(`book.js:549–551`.)*
- **AC3** Related sets follow the model: core→all parts; part→its chapters; chapter→its part + sibling chapters. *(`relatedIds`, `book.js:497–506`.)*

### A4 — Cross-relation connector lines
**As a Reader,** I want selecting a node to draw lines to everything it connects to, so I can see relationships, not just read them.
- **AC1** On select, accent-colored **curved** connectors are drawn from the selected node to each related node. *(`drawRelations`, `book.js:510–520`; `#grel` layer, `book.js:420`.)*
- **AC2** Each connector animates in with a stroke-dashoffset **draw** from the selected node outward (`@keyframes relDraw`, per-path `--len`). *(`book.css:182–183`.)*
- **AC3** Connectors are re-computed and re-drawn on every new selection (no stale lines).
- **AC4** Connectors reposition live while a node is dragged. *(`.glink,.rel` both updated in `positions()`, `book.js:443–446`.)*
- **AC5** Connectors are non-interactive (`pointer-events:none`) and carry an accent glow. *(`book.css:180–181`.)*
- **AC6** Under `prefers-reduced-motion: reduce`, connectors appear instantly, fully drawn. *(`book.css:421`.)*

### A5 — Focus dimming on selection
**As a Reader,** I want the rest of the graph to fade when I focus a node, so the connections I care about stand out.
- **AC1** Selecting a node dims unrelated nodes and base links, and highlights the kept set. *(`applyFocus`, `book.js:483–496`.)*
- **AC2** The selected node scales up and gets an accent drop-shadow ring. *(`.node.sel`, `book.css:165,169`.)*
- **AC3** Deselecting (empty-canvas click) restores the full, undimmed graph via re-selecting `core`.

### A6 — Full-viewport-width graph stage
**As a Reader,** I want the graph to use the whole width of my screen, so a dense network is legible instead of cramped in a column.
- **AC1** The network view breaks out of the 960px article column to full viewport width. *(`.graphfull{width:100vw;margin-inline:calc(50% - 50vw)}`, `book.css:133`; container class in `book.js:160`.)*
- **AC2** The SVG scales fluidly (`viewBox 1200×760` shell / `W=1360,H=760` layout, `width:100%`, `height:min(72vh,720px)`, `min-height:440px`). *(`book.js:162,370`; `book.css:148`.)*
- **AC3** The breakout is symmetric in RTL (logical `margin-inline`/`inset-inline-*`).
- **AC4** The stage is a bordered, rounded card with a Linear-style dotted grid, accent wash, glass hint pill, and Reset button. *(`.svgwrap`, `.svgwrap::before`, `.ghint`, `.greset`, `book.css:139–159`.)*
- **AC5** The page `<body>` does **not** scroll horizontally at any breakpoint. *(QA gate — see PRD-v2 Risk R3.)*
- **AC6** Node sizes and elliptical layout keep all outer labels within the canvas (core 46 / part 30 / chapter 18; `Rx=470,Ry=262`). *(`book.js:372–388`.)*

### A7 — Drag-to-rearrange, curved links, reset
**As a Reader,** I want to nudge nodes around and reset the layout, so I can untangle a view and put it back.
- **AC1** Any node can be dragged within the canvas bounds. *(`onDown`/`onMove`/`onUp`, `book.js:454–473`.)*
- **AC2** Base structural links render as **curved** paths (quadratic Bézier), not straight lines. *(`<path class="glink">` + `linkPath()`, `book.js:402,432–437`.)*
- **AC3** Dragging updates both nodes and all links/connectors in real time.
- **AC4** The **Reset** button returns nodes to their home positions. *(`greset` → `GRAPH.reset()` restoring `hx/hy`, `book.js:559,624`.)*
- **AC5** A hint pill states the interaction ("Click a node to read more · drag to move"), bilingual. *(`book.js:611`.)*

### A8 — Linear × Raycast × Apple redesign (shared across catalog + book pages)
**As a Reader,** I want the whole site to feel like crafted software, so I trust it and want to share it.
- **AC1** `book.css` and the `index.html` inline `<style>` share one token palette (bg/card/line/accent/shadow/motion), values matching. *(`book.css:1–29`; `index.html:34–57`.)*
- **AC2** Dark default is near-black `--bg:#0a0a0d`; accent is indigo `--accent:#5b63e6` (light) / `#8b8fff` (dark) with `--accent-2` violet. Borders are translucent hairlines.
- **AC3** The hero is a dark aurora band in **both** themes: gradient `hero-1→hero-2` plus two blurred accent/secondary radials. *(`book.css:50–54`; `index.html:71–75`.)*
- **AC4** English display headings use Inter (sans) with tight tracking, overriding the previous Newsreader serif; Persian uses Vazirmatn. *(`book.css:402–411`.)*
- **AC5** Cards lift on hover; `--shadow`/`--shadow-lg` elevation tokens are used consistently. *(`book.css:414–415`.)*
- **AC6** Both light and dark are fully styled and legible on every section.

### A9 — Motion & interaction polish
**As a Reader,** I want controls to respond the instant I touch them, so the UI feels alive.
- **AC1** Buttons/controls/rungs depress on press (`:active { transform: scale(.96) }`). *(`book.css:42`.)*
- **AC2** Shared motion tokens (`--ease*`, `--d1/--d2/--d3`) drive transitions. *(`book.css:13–14,27–28`.)*
- **AC3** Keyboard focus shows an accent `:focus-visible` ring. *(`book.css:43`.)*
- **AC4** Node hover/select scale transitions are smooth and pinned to the node (`transform-box: fill-box`). *(`book.css:163–167`.)*
- **AC5** `prefers-reduced-motion: reduce` neutralizes animations/transitions site-wide (book pages and catalog). *(`book.css:418–422`; `index.html:80`.)*

### A10 — English-default, Persian one tap away
**As a Reader,** I want the site to open in English by default while keeping Persian one click away, so it's shareable and indexable without losing the bilingual promise.
- **AC1** All 45 book shells and the catalog declare `<html lang="en" dir="ltr" data-lang="en">`. *(Verified 45/45 shells + `index.html:3`.)*
- **AC2** Pre-paint boot fallback is `pbl-lang' || 'en'` on every shell and the catalog. *(Verified 45/45; `index.html:17`.)*
- **AC3** Runtime language fallbacks are `'en'`: `book.js:29`, `book.js:682`, `recommend.js:20`, `index.html:260`.
- **AC4** No `|| 'fa'` default remains in any shell, `book.js`, `recommend.js`, or `index.html`. *(Verified: 0 occurrences.)*
- **AC5** A stored `pbl-lang=fa` still boots Persian/RTL before first paint (no wrong-direction flash).
- **AC6** The language toggle flips EN↔FA live and persists across navigation; Persian content and RTL layout are unchanged.

### A11 — v1 features preserved (regression guard)
**As a Reader,** I want everything that worked before to keep working after the redesign.
- **AC1** Centered-logo masthead links home on every page. *(`MASTHEAD`, `book.js:62–68`.)*
- **AC2** Library nav (Home / Prev / Next / All-books overlay) works, including Esc-to-close and current-book highlight. *(`renderLibraryNav`, `book.js:224–273`.)*
- **AC3** The "Find my reading path" wizard still opens from the catalog and functions. *(`assets/recommend.js` + `recommend.css`; trigger `index.html:226`.)*
- **AC4** Graph tabs still switch between **Interactive network** and **Structured map**. *(`setupTabs`, `book.js:614–627`.)*
- **AC5** The 5-stage ladder, quotes, media, "apply it," and method sections all still render from `DATA`.
- **AC6** Theme and language persist across pages under `pbl-theme` / `pbl-lang`.

---

## B. Backlog / follow-ups

Prioritized. Items B1–B3 are the highest-value gaps surfaced by the v2 audit (see PRD-v2 §9 Risks).

### B1 — Keyboard & screen-reader access to the graph *(P0, a11y)*
**As a keyboard or screen-reader Reader,** I want to reach and activate graph nodes without a mouse.
- **AC1** Nodes are focusable (roving `tabindex`) with `role="button"` and accessible names.
- **AC2** Enter/Space select a node (same path as click).
- **AC3** The summary card is a polite live region (or receives focus on open) so its content is announced. *(Gap: no `tabindex`/`role`/`keydown` on nodes `book.js:421–426`; no `aria-live` on `#detailHost`.)*
- **AC4** A visible focus indicator tracks the focused node.

### B2 — Guarantee no horizontal scroll from the full-bleed graph *(P1)*
**As a Reader on any browser,** I never want a horizontal scrollbar from the `100vw` breakout.
- **AC1** The graph stays edge-to-edge with **no** body horizontal scroll when a vertical scrollbar is present.
- **AC2** Verified on Windows/Chromium (classic scrollbars), macOS, iOS, Android. *(Risk: `100vw` includes scrollbar width, `book.css:133`.)*

### B3 — Token & a11y parity across all files *(P2, cleanup)*
**As a Maintainer,** I want the design tokens and a11y media queries identical everywhere.
- **AC1** `index.html` inline style gains `prefers-reduced-transparency: reduce` (currently only in `book.css`).
- **AC2** Motion-token set matches across `book.css` and `index.html` (align `--d3`).
- **AC3** Remove or wire up the unused `--glow` token in `book.css`.
- **AC4** `recommend.css` honors reduced-motion / focus-visible or is confirmed covered by the global clamp.

### B4 — Deep-link a selected concept *(P2)*
**As a Reader,** I want a shareable URL that opens the graph focused on a specific node.
- **AC1** Selecting a node updates the URL hash; loading a hash auto-selects that node and draws its relations.
- **AC2** Back/forward navigates selection history.

### B5 — Graph engagement instrumentation *(P2)*
**As a Maintainer,** I want to measure the PRD success metrics (M1/M2).
- **AC1** A privacy-respecting, dependency-free counter records node selections and chip traversals per session.
- **AC2** No third-party runtime dependency is added (respects the no-dependency constraint).

### B6 — Desktop close affordance for the summary card *(P3)*
**As a Reader,** I want an obvious way to dismiss the card on desktop beyond clicking empty canvas.
- **AC1** A small close control on the floating card returns to the default (core) view.
- **AC2** Discoverability is preserved by the existing hint pill.

### B7 — Local media placeholder *(P3)*
**As a Reader offline or on a blocked network,** I want media cards to degrade gracefully.
- **AC1** A local placeholder replaces failed `i.ytimg.com` thumbnails instead of hiding the image. *(`book.js:294–298`.)*

### B8 — Per-book layout overrides for dense graphs *(P3)*
**As a Content editor** adding a book with many chapters per part, I want to tune spacing.
- **AC1** The layout reads optional `DATA.graph` overrides (`span`, `R2`, and — restored — canvas sizing) so unusually shaped books don't overlap. *(Currently `gp.W/H/R1` are ignored after the rewrite; only `gp.R2`/`gp.span` are read, `book.js:373–374`.)*
