# PRD — Library Navigation + CMS Templating

**Product:** The Product Builder's Library — a bilingual (English / فارسی, RTL-first), no-build, offline-capable static site of 45 interactive book "knowledge-graph" pages across 15 skill groups.
**Status:** Delivered (retrospective PRD — documents the system as shipped on this branch).
**Author:** Product Manager
**Related docs:** [`feature-requests.md`](feature-requests.md) · [`../README.md`](../README.md)

---

## 1. Overview & problem statement

The library is 45 book pages organized as `NN - Group/slug.html` (e.g. `01 - Communication/on-writing-well.html`). Each page teaches one book through an interactive radial knowledge graph, a 5-stage learning ladder, verbatim quotes, curated media, and an "apply it" section, with EN/فارسی and light/dark toggles.

Two problems had accumulated:

**P1 — The pages were unmaintainable at scale.** Every page was a ~904-line / ~101 KB self-contained HTML file. Roughly **688 identical lines of CSS + JS were copy-pasted into all 45 files.** Only the inline `DATA` object (content), the hero markup, and four hard-coded per-book values (method text, flow words, graph geometry) actually differed. A single UI fix — a color, a graph tweak, a copy change to a shared label — meant editing 45 files by hand and hoping they stayed in sync. Theme and language preferences were stored per-book, so a reader's choice did not carry from one page to the next.

**P2 — Readers were trapped on a page.** Once inside a book, there was no in-page way to move to the next book, jump back a book, return to the catalog, or browse the full library. The only path between books was the browser back button to `index.html`.

This PRD covers the two features shipped to resolve these: a **library navigation header** on every book page (P2), and a **CMS templating / shared-asset architecture** with migration + verification tooling (P1).

---

## 2. Goals / non-goals

### Goals
- **G1.** Make a book editable by touching **only its content** — one `DATA` object per page — and make every UI change a **one-file** edit shared by all 45 pages.
- **G2.** Migrate all 45 existing pages to the shared architecture **losslessly** — no rendered content may change — and prove it mechanically.
- **G3.** Let readers move freely between books: home, previous, next, and a full-library browser — from every page.
- **G4.** Persist theme and language **across the whole library**, not per book.
- **G5.** Preserve the existing constraints: no build step, no server, no runtime dependencies (fonts via CDN), full EN/فارسی + RTL/LTR + light/dark support, offline-capable once assets are cached.

### Non-goals
- Rewriting or restyling the book pages' visual design (migration is behavior-preserving).
- Adding a backend, CMS server, or database. "CMS" here means a **content/presentation split in static files**, not a hosted system.
- Rebuilding `index.html` from the new manifest (candidate follow-up — see [`feature-requests.md`](feature-requests.md)).
- Search, filtering, or per-book social/OG images (future).

---

## 3. Feature 1 — Library navigation header

A sticky navigation bar rendered on every book page by the shared runtime. It augments the pre-existing section table-of-contents (TOC) and the language/theme toggles with true library-level navigation.

### 3.1 Components
| Control | Behavior |
|---|---|
| **Home** | Icon button → `../index.html` (the catalog). Always present. |
| **Previous book** | Icon button → the previous book in reading order. Disabled (no `href`, `aria-disabled="true"`) on the first book. Hidden on small screens (`hide-sm`). |
| **Next book** | Icon button → the next book in reading order. Disabled on the last book. Hidden on small screens. |
| **All books** | Button that opens the full-library overlay (below). `aria-haspopup="dialog"`. Always present. |
| **Brand label** | The current book's English title, shown inline in the nav. |
| **Section TOC** | Existing in-page anchors (In a nutshell · Knowledge graph · 5 stages · Quotes · Watch & explore · Apply it) with scroll-spy active-state. |
| **Language toggle** | EN ⇄ فارسی. |
| **Theme toggle** | Light ⇄ Dark. |

### 3.2 Reading order
Reading order is defined by the manifest (`window.LIBRARY`): **group number ascending, then filename (slug) ascending** within a group. Prev/Next walk this single flat sequence across group boundaries (e.g. the last book of group 1 links forward to the first book of group 2). The current book is located in the manifest by matching `DATA.meta.slug`.

### 3.3 All-books overlay
- Full-screen modal (`role="dialog"`, `aria-modal="true"`), opened by **All books**.
- Header: library title + subtitle ("45 books · 15 skill groups — jump to any page"), both bilingual, plus a close button.
- Body: a grid **grouped by the 15 skill groups**, each group showing its number, its bilingual name, and its 3 book links. Groups render in `groupNum` order.
- The **current book is highlighted** (`.cur` class on its link).
- Every link navigates directly to that book's page via the manifest-derived path (`../<folder>/<slug>.html`).

### 3.4 Requirements
- **R1.1** The header renders on every book page, driven entirely by `DATA.meta` + `window.LIBRARY` — no per-page navigation markup is authored by hand.
- **R1.2** Prev/Next resolve from reading order; endpoints disable the unavailable direction rather than linking nowhere.
- **R1.3** The overlay lists all 15 groups × 3 books, grouped and ordered, with the current book highlighted.
- **R1.4** Fully bilingual: every label has EN and فارسی text; the active language's text shows via the `data-only` mechanism. Layout is correct in both LTR and RTL.
- **R1.5** The nav is sticky and remains available while scrolling.
- **R1.6** The overlay closes on: the close button, a click on the backdrop (outside the sheet), and the **Esc** key.
- **R1.7** No new dependencies; icons are inline SVG.

### 3.5 Acceptance criteria
- ✅ From the first book, **Previous** is disabled and **Next** links to the second book; from the last book, the reverse.
- ✅ **Next** from the last book of a group lands on the first book of the following group.
- ✅ **All books** opens an overlay of 15 groups × 3 books; the page you opened it from is visually marked as current.
- ✅ Clicking any overlay link loads that book page.
- ✅ Esc, backdrop click, and the close button each dismiss the overlay.
- ✅ **Home** returns to `../index.html`.
- ✅ All of the above render and read correctly in فارسی/RTL and in dark theme.

---

## 4. Feature 2 — CMS templating (shared-asset architecture)

A content/presentation split that turns 45 duplicated monoliths into 45 thin content shells over a single shared runtime.

### 4.1 Shared assets
| File | Role |
|---|---|
| `assets/book.css` | The one style block, extracted once from the originals, **plus** the new library-nav styles. Loaded (and cached) by all 45 pages. |
| `assets/book.js` | The shared runtime. From a single `DATA` object it renders the hero, the sticky nav + library header, all content sections, the interactive knowledge graph, and the 5-stage ladder. Public entry point: `Book.mount(DATA)`. Depends on `window.LIBRARY`. |
| `assets/library.js` | Generated manifest: `window.LIBRARY` = all 45 books as `{slug, folder, groupNum, group{en,fa}, book{en,fa}}`. Drives prev/next + the overlay. |

### 4.2 Authoring model — "edit only DATA"
- **To change a book's content:** edit that page's `DATA` object only. Nothing else on the page is hand-authored — the shell is boilerplate that loads the shared assets and calls `Book.mount(DATA)`.
- **To change the UI (any book, all books):** edit one shared file (`book.css` for style, `book.js` for structure/behavior).
- A page shell is ~40 lines of boilerplate (head, theme/lang boot script, font + asset links, `<div id="app">`, three script tags) wrapping the inlined `DATA`.

### 4.3 Page shell contract
Each migrated page:
1. Sets `lang`/`dir`/`data-lang` on `<html>` and runs a tiny **pre-paint boot script** that reads `pbl-theme` and `pbl-lang` from `localStorage` (falling back to `prefers-color-scheme` and `fa`) and stamps `data-theme` / `data-lang` / `dir` before first paint to avoid a flash.
2. Loads the Vazirmatn + Inter/Newsreader fonts (CDN), then `../assets/book.css`.
3. Loads `../assets/library.js`, then `../assets/book.js`.
4. Calls `Book.mount({ …DATA… })` with the inlined per-book object.

### 4.4 Unified theme/language persistence
- localStorage keys were unified to **`pbl-theme`** and **`pbl-lang`** (previously per-book keys). Theme and language now persist across the whole library, and the pre-paint boot script applies them on every page before render.
- `book.js` writes these keys on toggle and honors an OS `prefers-color-scheme` change **only when the user has not set an explicit theme**.

### 4.5 Migration tooling — `tools/migrate.js`
One-shot migrator. For every `NN - Group/slug.html`:
1. Reads the legacy self-contained page.
2. Extracts the inline `DATA` object (already valid JSON), the four per-book deltas (method text, flow words, graph `W/H/R1/R2/span`), and all hero/meta strings (title, eyebrow author, hero title, dek, metastrip book/author/published/group, hero chips, nutshell kboxes, and the two callouts with their labels).
3. Assembles an augmented `DATA` = `{ meta, method, flow, graph, …original content }`.
4. Re-emits the page as a thin shell that loads the shared assets and inlines only `DATA`.
5. Collects a manifest → writes `assets/library.js`.

Modes: `node tools/migrate.js --check` (parse + validate, writes nothing) and `--write` (also rewrites pages + manifest). Guards: fails loudly if any field cannot be extracted, if `DATA` is not valid JSON, if a page's chip/kbox/metastrip counts are off, or if the serialized `DATA` contains `</script` (which would break inlining).

### 4.6 Verification tooling — `tools/verify.js`
Proves the migration was lossless by comparing each on-disk migrated page against the **original committed at git HEAD**:
1. **Content parity** — migrated `DATA` minus the four added keys (`meta`/`method`/`flow`/`graph`) must **deep-equal** the original inline `DATA`.
2. **Delta parity** — `DATA.method` / `DATA.flow` / `DATA.graph` must equal the values that were hard-coded in the original page's JavaScript.
3. **Wiring** — the migrated page must reference `../assets/book.css`, `../assets/book.js`, `../assets/library.js` and carry the essential `meta` fields.

Exit 0 = all 45 pass; non-zero prints the first drift. **Result on this branch: 45/45 pages passed.**

### 4.7 Requirements
- **R2.1** All shared CSS/JS lives in exactly one place each; no page duplicates it.
- **R2.2** Editing a book requires editing only its `DATA` object.
- **R2.3** Migration is lossless — no rendered output changes — and this is mechanically verifiable (`tools/verify.js`).
- **R2.4** `assets/library.js` is generated from the pages, not hand-maintained.
- **R2.5** Theme and language persist across the whole library via `pbl-theme` / `pbl-lang`, with no flash of the wrong theme/direction on load.
- **R2.6** No build step, server, or runtime dependency is introduced (fonts remain CDN, tooling is plain Node with no npm install).

### 4.8 Acceptance criteria
- ✅ `node tools/verify.js` → "45/45 pages passed."
- ✅ `node tools/migrate.js --check` re-validates extraction on all 45 pages without writing.
- ✅ A book's rendered page is identical before/after migration (graph node counts, viewBox, sections, both languages, both themes).
- ✅ Each page dropped from ~101 KB to ~58 KB; the ~75 KB of shared assets loads once and caches across all 45 pages.
- ✅ Toggling theme/language on one page and navigating to another preserves the choice.

---

## 5. The DATA schema contract

`assets/book.js` consumes a single `DATA` object per page. Bilingual strings are the pair `{en, fa}` (referred to below as **LStr**). Notes on rendering behavior are called out where they affect authoring.

### 5.1 Top-level shape
```
DATA = {
  meta,        // object — hero, nav, metastrip, chips, callouts
  method,      // { en, fa } — HTML string ("Sources & notes")
  flow,        // { en:[…], fa:[…] } — flow-line words (structured map)
  graph,       // { W, H, R1, R2, span } — knowledge-graph geometry
  tldr:  [ LStr, … ],     // "In a nutshell" bullets
  parts: [ Part, … ],     // top-level branches of the graph
  chapters: { key: Chapter, … },  // keyed lookup, referenced by parts
  core,        // center node of the graph
  stages: [ Stage, … ],   // 5-stage ladder (level 1→5)
  quotes: [ LStr, … ],    // verbatim quotes, translated alongside
  media:  [ Media, … ],   // "Watch & explore" cards
  go:     [ Go, … ],      // "go straight to the source" links
  recs:   [ Rec, … ]      // "apply it this week" items
}
```

### 5.2 `meta`
| Field | Type | Notes |
|---|---|---|
| `slug` | string | Identifies the current book in `window.LIBRARY` (prev/next/highlight). |
| `folder` | string | `"NN - Group"`; used to build book hrefs. |
| `groupNum` | number | Skill-group index (1–15); overlay grouping + reading order. |
| `group` | LStr | Group name; shown in metastrip + overlay group header. |
| `author` | LStr | Metastrip; also the eyebrow author fallback. |
| `eyebrow_author` | LStr | Optional. Overrides `author` in the eyebrow line (kept verbatim — often an intentionally shortened form). |
| `book` | LStr | Metastrip; `book.en` is also the nav brand label. |
| `hero_title` | LStr | `<h1>`. May contain inline markup. |
| `dek` | LStr | Optional. Hero sub-line; falls back to empty. |
| `published` | LStr | Metastrip. **Persian digits are authored directly** (e.g. `"۱۹۷۶"`) — meta text is not run through digit shaping. |
| `chips` | `[{ v:LStr, l:LStr }]` | Hero stat chips (value + label). 3 in practice. |
| `kboxes` | `[{ v:LStr, l:LStr }]` | "In a nutshell" stat grid. 4 in practice. |
| `core_callout` | `{ label:LStr, en, fa }` | Accent callout under the nutshell. `en`/`fa` are body strings (may include `<i>`/`<b>`; passed through raw). Label varies per book ("The core idea", …). |
| `flow_callout` | `{ label:LStr, en, fa }` | Callout under the structured map. Same shape/behavior as `core_callout`. |

> **Meta rendering note:** hero/meta strings are emitted verbatim for both languages (shown via the `data-only` mechanism) and are **not** run through Persian digit / bidi shaping. Content-section strings (below) **are** shaped for فارسی. Author meta text in final form per language.

### 5.3 The four deltas
| Field | Type | Notes |
|---|---|---|
| `method` | `{ en, fa }` | HTML string for "Sources & notes". `fa` is bidi/digit-shaped at render; `en` raw. |
| `flow` | `{ en:[string], fa:[string] }` | Words joined by arrows on the structured-map flow line (arrow direction follows language). |
| `graph.W`, `graph.H` | number | SVG `viewBox` width/height (custom per book). |
| `graph.R1` | number | Radius of the **part** ring around the core. |
| `graph.R2` | number | Radius of the **chapter** ring around each part. |
| `graph.span` | number | Angular spread (degrees) of a part's chapters around its part node. |

### 5.4 `Part`
| Field | Type | Notes |
|---|---|---|
| `key` | string | Unique part id; referenced by chapters (`chapter.part`) and node ids. |
| `varc` | string | CSS custom-property name for the part color (e.g. `"--c-teal"`). |
| `name` | LStr | Part name (node label + legend + map column). |
| `tag` | LStr | Short descriptor ("The foundations"). |
| `gist` | LStr | One-line summary; also the part node's "big idea" in the graph. |
| `more` | LStr | Deeper detail shown when the part node is selected. |
| `chapters` | `[string]` | Ordered list of chapter keys under this part. |

### 5.5 `Chapter` (values of `DATA.chapters`)
| Field | Type | Notes |
|---|---|---|
| `part` | string | Parent part key. |
| `n` | number | Display number (shown inside the chapter node + as "Idea N"). |
| `name` | LStr | Full chapter title. |
| `glabel` | LStr | Optional short label used on the graph node (falls back to `name`). |
| `principle` | LStr | The chapter's core idea. |
| `more` | LStr | Optional deeper detail. |
| `example` | LStr | Optional concrete example. |
| `tip` | LStr | Optional "try this". |
| `pitfall` | LStr | Optional "watch out". |

### 5.6 `core`
| Field | Type | Notes |
|---|---|---|
| `name` | LStr | Center-node label (the book's single core idea). |
| `principle` | LStr | Shown when the core node is selected. |
| `more` | LStr | Optional deeper detail. |
| `example` | LStr | Optional (often the "click a node / drag" hint). |

### 5.7 `Stage` (5 items, `level` 1→5)
| Field | Type | Notes |
|---|---|---|
| `level` | number | 1–5; drives the ladder bar width (`level × 20%`). |
| `badge` | LStr | e.g. "Level 1 · Over-simplified". |
| `title` | LStr | Stage title. |
| `tagline` | LStr | One-line summary. |
| `body` | LStr | Main text (may contain `<b>`). |
| `example` | LStr | Worked example. |
| `gain` | LStr | What the reader can now do. |

### 5.8 `Media`
| Field | Type | Notes |
|---|---|---|
| `kind` | string | `"yt"` renders a YouTube thumbnail (from `id`) + VIDEO badge; any other value renders an image-style card from `url`. |
| `id` | string | YouTube video id (when `kind === "yt"`). |
| `url` | string | Link target (when not a YouTube item). |
| `src` | LStr | Source line ("YouTube · Channel"). |
| `title` | LStr | Card title. |
| `desc` | LStr | Short description. |
| `bullets` | `{ en:[string], fa:[string] }` | What it covers. |
| `best` | LStr | "Best for Stage 1–2" style note. |

### 5.9 `Go` and `Rec`
| Field | Type | Notes |
|---|---|---|
| `go[].label` | LStr | Link label. |
| `go[].url` | string | Destination (opens in a new tab). |
| `recs[].pri` | string | `"b"` → "Start here"; anything else → "Then this". |
| `recs[].t` | LStr | Action title. |
| `recs[].d` | LStr | Action detail. |

### 5.10 Graph derivation (invariant)
The knowledge graph is a deterministic radial layout with **1 core + one node per part + one node per chapter**. Node count = `1 + parts.length + Σ chapters`. A 4-part book with 14 chapters ⇒ **19 nodes**; a 5-part book with 16 chapters ⇒ **22 nodes**. Colors come from each part's `varc`; the per-book `graph` geometry controls the viewBox and ring spacing.

---

## 6. Success metrics

| Metric | Target | Result |
|---|---|---|
| Per-page size | Meaningful reduction | **~101 KB → ~58 KB** per page (~42%). |
| Duplicated UI code | Eliminated | **~688 duplicated CSS+JS lines × 45 pages** collapsed into single shared files. |
| Single source of truth (UI) | One file per concern | UI = `book.css` + `book.js`; manifest = generated `library.js`. |
| Lossless migration | 45/45 verified | **`tools/verify.js` → 45/45 passed.** |
| Cross-library persistence | Theme + language persist everywhere | Unified `pbl-theme` / `pbl-lang`, applied pre-paint. |
| Reader navigation | Home / prev / next / all-books on every page | Delivered. |
| Shared-asset caching | Load once for all 45 | ~75 KB of assets cached across the library. |

---

## 7. Rollout & risks

### Rollout
1. Extract shared `book.css` / `book.js`; author the library-nav header + overlay in the shared runtime.
2. `node tools/migrate.js --check` to validate extraction on all 45 pages.
3. `node tools/migrate.js --write` to rewrite pages + generate `assets/library.js`.
4. `node tools/verify.js` to prove lossless parity against git HEAD (45/45).
5. Browser spot-checks: graph node counts, custom viewBox, EN/LTR + فارسی/RTL, theme+lang persistence across navigation, overlay behavior.

### Risks & mitigations
| Risk | Impact | Mitigation / status |
|---|---|---|
| **No cache-busting on shared assets.** Pages link `../assets/book.js`/`.css` with no version hash. After a UI change, browsers may serve a stale cached copy — inconsistently across the 45 pages. | Medium | Add a version query (`book.js?v=…`) or content hash on future UI releases; document a hard-refresh step. **Open.** |
| **Two sources of truth for the catalog.** `index.html` still carries its own embedded book list and does not read `window.LIBRARY`. Adding/renaming a book means updating both the manifest and `index.html`. | Medium | Regenerate `index.html` from the manifest (tracked in [`feature-requests.md`](feature-requests.md)). **Open.** |
| **Verification baseline is git HEAD.** `verify.js` proves parity against the originals at HEAD; once later commits change pages, it stops being a regression guard — it is a one-time migration proof. | Low | Treat as a migration artifact; add a content-drift test if pages are edited post-migration. |
| **DATA inlined as JSON.** A stray `</script` in content would break the page. | Low | `migrate.js` throws on `</script` in serialized DATA. Mitigated. |
| **Adding a book is a two-step manual flow.** New pages require re-running `migrate.js` (to regenerate the manifest) or hand-editing `library.js`; a hand-added page won't appear in prev/next or the overlay until the manifest includes it. | Low | Document the "add a book" flow; consider a scaffold command. |
| **Prev/Next hidden on small screens** (`hide-sm`). Mobile readers rely on Home + All books to move between books. | Low | Intentional; the overlay covers the need. Revisit if mobile prev/next is requested. |
| **Overlay lacks a focus trap.** It is `role="dialog" aria-modal="true"` but does not trap keyboard focus. | Low | Esc + backdrop + close button all work; add focus management in an a11y pass. |
| **Fonts require CDN.** "Offline-ready" holds only after fonts are cached; a cold offline load falls back to system fonts. | Low | Pre-existing; acceptable. Self-host fonts if strict offline is required. |
