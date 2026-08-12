# CLAUDE.md — The Product Builder's Library

Context for AI tools working in **this repository**. This is a standalone project;
it is unrelated to any other CLAUDE.md that may exist in a parent folder.

---

## What this is

A **bilingual (English / فارسی), right-to-left** static website: interactive
knowledge-graph summaries of **59 essential product books**, grouped into **18
skill groups** — the 15 from Lenny Rachitsky's "Essential books for product
builders", plus three of our own: Self Mastery, Working with AI, and
Delivery & Projects.

- **No build step, no dependencies, no server required.** Plain HTML/CSS/JS.
- Fonts load from a CDN when online; everything else is local and works offline.
- Open `index.html` in any modern browser, or serve the folder over HTTP.

## Layout

```
index.html                  Catalog / home. Centered-logo masthead + "Find my
                            reading path" wizard. Has its own GROUPS data (author,
                            "why", href for each of the 59 books).
graph.html                  The Atlas — one force-directed map of every group and
                            book, with dashed lines for cross-group kinship, plus
                            the search field. Reads window.ATLAS; linked from the hero.
NN - Group/<slug>.html      59 book pages. Thin SHELLS (see "How a book page works").
assets/
  book.css                  Shared styles for every book page + masthead.
  book.js                   Shared runtime. Renders hero + nav + knowledge graph +
                            5 stages + all sections from a page's DATA. Entry:
                            Book.mount(DATA). Also injects the centered-logo masthead
                            and the library nav (home / prev / next / all-books).
  library.js                window.LIBRARY — generated manifest of all 59 books
                            (slug, folder, groupNum, group{en,fa}, book{en,fa}).
                            Drives prev/next, the all-books overlay, and the wizard.
  atlas.js                  window.ATLAS — generated {groups, books, relations}
                            for graph.html. Relations carry a bilingual "why";
                            books carry author/published/summary, which the
                            atlas search indexes.
  graph-camera.js           window.GraphCamera — the engine BOTH graphs share:
                            force simulation, pointer handling (drag / pan /
                            pinch, pointer-id ownership, pointercancel), and the
                            camera. Three coordinate spaces: `world` (where nodes
                            live — the physics clamp box), `stage` (the viewBox,
                            held at the element's aspect ratio), and screen.
                            The camera is a <g id="cam"> transform, so zooming
                            never touches node coordinates. Callers MUST render
                            into `G.layer.innerHTML` — assigning svg.innerHTML
                            deletes the camera group — then call
                            G.indexElements() and G.paint().
  recommend.js              "Find my reading path" wizard: 3-step (modal on desktop,
  recommend.css             bottom-sheet on mobile). Scores books by seniority +
                            focus + time. Self-contained; depends only on window.LIBRARY.
tools/
  build-page.js             Assembles a book page from a standalone DATA json:
                            `node tools/build-page.js path/to/<slug>.json`. Validates
                            the invariants book.js relies on and refuses to write a
                            broken payload. Idempotent — safe to re-emit any page.
  build-manifest.js         Regenerates assets/library.js from the book pages. Run
                            this whenever a book is added, renamed, or moved.
  build-atlas.js            Regenerates assets/atlas.js. Merges the curated layer in
                            docs/atlas-content.json (summaries + relations); falls
                            back to deriving relations from recommend.js tag tables.
  migrate.js                ONE-SHOT migration (original self-contained pages -> shells).
                            Already run; do not run again on migrated pages.
  verify.js                 One-shot pre-commit parity proof (diffs working tree vs
                            git HEAD). Self-invalidates once the migration is committed;
                            do NOT wire it into CI.
docs/                       PRD, art direction, feature requests, QA + CTO reports,
                            maintenance GUIDE, and atlas-content.json (curated
                            per-book summaries + the cross-book relation graph).
```

## How a book page works (the "CMS")

Every book page is a thin shell. All content lives in one inline `DATA` object:

```html
<head> … boot (theme+lang) … <link rel="stylesheet" href="../assets/book.css"> </head>
<body>
  <div id="app"></div>
  <script src="../assets/library.js"></script>
  <script src="../assets/book.js"></script>
  <script>
    window.DATA = { meta:{…}, tldr:[…], parts:[…], chapters:{…}, core:{…},
                    stages:[…], quotes:[…], media:[…], go:[…], recs:[…],
                    method:{…}, flow:{…}, graph:{…} };
    Book.mount(window.DATA);
  </script>
</body>
```

`book.css` + `book.js` are identical across all 59 pages. **To change a book's
content, edit only that page's `DATA`.** To change look or behavior for every book,
edit the shared asset once.

### DATA shape (essentials)
- `meta` — hero/nav strings: `slug`, `book{en,fa}`, `author{en,fa}`, `published{en,fa}`,
  `group{en,fa}`, `hero_title{en,fa}`, `dek{en,fa}`, `chips[]`, `kboxes[]`,
  `core_callout{label,en,fa}`, `flow_callout{label,en,fa}`. `slug` MUST match the
  page filename and the manifest.
- `parts[]` + `chapters{}` — the knowledge graph. Invariant: `parts.length` +
  total chapters + 1 core node = the node count the graph draws. In practice every
  page ships **4 parts × 3 chapters + 1 core = 17 nodes**; `tools/build-page.js`
  enforces that, along with `chapters[].n` running 1…12 and each part's `varc`
  being `--c-teal`, `--c-blue`, `--c-violet`, `--c-amber` in order.
- `stages[]` — exactly 5 learning stages.
- `method{en,fa}` (sources note) and `flow{en:[],fa:[]}` (the map flow words).
- `graph{W,H,R1,R2,span}` — optional layout tuning; book.js has defaults.

## Conventions
- **Bilingual:** every user string is `{en, fa}`. Persian is primary; RTL layout.
  Numbers are shown as Persian digits in FA mode (handled by book.js `faDigits`).
- **Design tokens:** colors/spacing come from CSS vars (`--bg`, `--card`, `--accent`,
  …) defined for both light and dark themes. Don't hardcode colors.
- **Persisted UI state:** `localStorage` keys `pbl-theme` and `pbl-lang` — shared
  library-wide (do not reintroduce per-book keys).
- **Content is author-trusted:** book.js renders DATA via innerHTML with no HTML
  escaping. This is safe for a single-author static site; never route untrusted
  input through `DATA`.

## Common tasks
- **Preview:** `python3 -m http.server 8000` then open `http://localhost:8000/`
  (or use `.claude/launch.json` → `static-site`).
- **Edit a book:** open `NN - Group/<slug>.html`, edit the inline `Book.mount(DATA)`.
- **Add a book:** write its DATA as a standalone `<slug>.json`, then

  ```bash
  node tools/build-page.js <slug>.json && node tools/build-manifest.js && node tools/build-atlas.js
  ```

  and add it to `GROUPS` in `index.html`. A new group also needs an entry in
  `GROUP_TAGS` (`assets/recommend.js`) and the book counts updated in `index.html`,
  `graph.html`, `assets/book.js` and `README.md`.
- **The wizard's recommendations:** book tags live in `assets/recommend.js`
  (`GROUP_TAGS` per group + `OVERRIDES` per slug). Edit there to tune the reading flow.
- **The atlas:** per-book summaries and the cross-book relations are curated in
  `docs/atlas-content.json`; run `node tools/build-atlas.js` after editing it.

## Deploy
Push to `main`; the site is static and can be served by GitHub Pages or any static
host. See `docs/GUIDE.md` for the step-by-step.

---
_Author: Behnam Atefi · https://www.linkedin.com/in/behnamatefi/_
