# HANDOFF — The Product Builder's Library

Written 2026-08-23, before migrating to a new MacBook.

---

## What this is

A bilingual (English / فارسی, RTL) static website holding interactive
knowledge-graph summaries of **60 essential product books** across **18 skill
groups** — the 15 from Lenny Rachitsky's "Essential books for product builders"
plus three of our own (Self Mastery, Working with AI, Delivery & Projects).

It is plain HTML/CSS/JS with **no build step, no dependencies and no server
required** — open `index.html` in a browser and it works, offline included
(fonts are the only CDN request).

## Where the work stands

`origin/main` = **`3b5e64e`** — "Add The Pyramid Principle to Communication".
Everything is committed and pushed; nothing is half-finished in the tree.

Recent arc, newest first:

| commit | what landed |
|---|---|
| `3b5e64e` | The Pyramid Principle (60th book) added to Communication |
| `881a759` | Zoom / pan / pinch camera + Atlas search + mobile scroll-trap fix |
| `5bd26f4` | 9 books in two new groups: Working with AI, Delivery & Projects |
| `98d745a` | Removed the LED bar-chart hero illustration |

The biggest recent change is `assets/graph-camera.js` — one shared engine
behind both the per-book graphs and the Atlas (force simulation, pointer
handling, camera). Before it, the two were a near-verbatim fork of each other.

## What I was in the middle of

Nothing was left broken or partly applied. The last task (adding The Pyramid
Principle) finished and pushed. What follows is the **deferred backlog** from
the approved zoom/pan plan — it was scoped out deliberately, not forgotten.

### Next 3 steps

1. **Accessibility pass** — the highest-value item, and partly a real bug.
   Both SVGs carry `role="img"` (`graph.html`, `assets/book.js` ~line 155)
   while their child nodes carry `role="button"`. Under ARIA that makes the
   subtree presentational, so **all 77 Atlas nodes are currently invisible to
   screen readers** even though they sit in the tab order. The `role` change is
   two characters and unblocks the rest: roving tabindex (77 tab stops → 1),
   arrow-key traversal (**Left/Right must mirror under `dir="rtl"`** — the
   likeliest bug in that work), `.dchip` spans → real `<button>`s, and focus
   restoration after `draw()` replaces the subtree.

2. **Touch targets** — at the Atlas's ~0.2 fit scale on a 390px phone a book
   node is a 2.8px dot, and adjacent books sit ~90 SVG units apart, so the
   geometry *cannot* reach the 44px guideline by enlarging hit circles alone.
   Now that zoom exists, set a default mobile zoom level, then add transparent
   hit circles and make labels clickable (`text.nlab{pointer-events:auto}` —
   currently all SVG text is `pointer-events:none`, so the dot is the whole
   target). Tune once, after the zoom default is chosen.

3. **Atlas label wrapping** — `shortTitle` (`graph.html`) truncates at 26
   characters for both the 15px hub labels and the 11.5px book labels. The
   longest title is 53 characters, and at 11.5px a 26-character label is ~164
   units wide while adjacent books are ~90 apart, so **labels already collide**.
   Fix is greedy word-boundary wrapping into `<tspan>`s, which also requires
   reworking the bbox-fit loop's `below = n.r + 22` to account for line count.
   Atlas only — `assets/book.js` labels are hand-authored short via `glabel`
   and should be left alone.

---

## Setup on a fresh machine

### Runtime versions (what this was developed against)

| tool | version here | needed for | notes |
|---|---|---|---|
| git | 2.54.0 (Apple Git-157) | everything | Xcode CLT is enough |
| node | v24.15.0 | `tools/*.js` only | **any Node 18+ works** — the tools use only `fs`, `path`, `child_process` |
| python3 | 3.9.6 | dev server only | macOS system Python is fine |

There is **no `package.json`, no `node_modules`, and nothing to `npm install`.**
That is by design, not an omission.

### Clone and run

```bash
git clone https://github.com/Behnamatefi/product-builders-library.git
cd product-builders-library
python3 -m http.server 8000
# then open http://localhost:8000/
```

`.claude/launch.json` already defines this as the `static-site` config, so in
Claude Code you can start it from there instead.

### Build / regenerate

Nothing needs building to view the site. These regenerate derived files after
you change content:

```bash
node tools/build-page.js <slug>.json    # assemble one book page from a DATA json
node tools/build-manifest.js            # rewrite assets/library.js  (the 60-book manifest)
node tools/build-atlas.js               # rewrite assets/atlas.js    (groups/books/relations)
```

`tools/build-page.js` validates the invariants `book.js` depends on and refuses
to write a broken payload. It round-trips an existing page byte-for-byte, so it
is also the safe way to re-emit every page after a shell change.

**Do not run** `tools/migrate.js` or `tools/verify.js` — both are one-shot and
already spent. `migrate.js` in particular would re-run the original
self-contained-page → shell migration.

### Tests

**There is no test suite.** Verification is done in a browser: serve the site,
then check the console is clean, the graph renders its expected node count, the
language toggle flips to RTL, and both themes hold. `docs/GUIDE.md` has the
maintenance walkthrough.

---

## Bring these over by hand (gitignored — NOT in any commit)

| path | what it is | verdict |
|---|---|---|
| `.claude/settings.local.json` | project-local Claude Code settings — a permissions allowlist with 1 entry | **copy** (tiny, or just re-approve on the new machine) |
| `pbtools.tar.gz` | 885K archive of the old `tools/` generator | **skip** — its contents are now committed on `wip/pre-migration-2026-08-23` |
| `.DS_Store` × 4 | macOS Finder cruft | **skip** |
| `.claude/worktrees/` | two git worktrees | **skip** — recreate with `git worktree add` if you want them |

**No `.env`, no keys, no certificates, no tokens exist anywhere in this
project.** I scanned for `.env*`, `*.pem`, `*.key`, `*.p12`, `id_rsa*`,
`*credential*` and `*secret*` — nothing. Nothing in this repo needs a
credential to run.

### Outside the repo

- `~/.claude/settings.json` — global Claude Code config. Holds
  `cleanupPeriodDays: 3650`, notification prefs, and the plugin setup below.
  Worth copying so the new machine behaves the same.
- Your GitHub credential for `github.com/Behnamatefi` (the remote is HTTPS, so
  a PAT in the macOS keychain or `gh auth login`).

## Installed globally that this project leans on

Nothing is a hard runtime dependency — the site is dependency-free — but these
shape the working environment:

- **Node** and **python3** (see the version table above).
- **Claude Code plugins**, enabled in `~/.claude/settings.json`:
  - `caveman@caveman` — from `https://github.com/juliusbrussee/caveman.git`
  - `figma@claude-plugins-official` — from the `anthropics/claude-plugins-official` marketplace
  Both are declared in `extraKnownMarketplaces`, so copying that file plus
  running Claude Code once should re-fetch them.
- No global npm packages, no Homebrew formulae, no language version managers.

---

## Branches on the remote

| branch | tip | what it is |
|---|---|---|
| `main` | `3b5e64e` | **the real work** — clone this |
| `v2Redesign` | `3b5e64e` | identical to main; kept as the working branch this session |
| `wip/pre-migration-2026-08-23` | `ec0ed27` | snapshot of uncommitted work found during migration prep (see below) |
| `claude/project-onboarding-github-00cac9` | `03ad04c` | old session branch, superseded |
| `claude/copilot-skills-setup-9ed5f2` | — | old session branch, superseded |

### About `wip/pre-migration-2026-08-23`

The main checkout was sitting at `0b93746` (the 45-book era) with 48 modified
pages and 51 untracked files on top — none of it in git. The untracked half is
the **original page generator**: `tools/buildbook.js` plus 44 per-book configs
in `tools/configs/`, `tools/engine.html`, `tools/vbook.js`,
`tools/patchcatalog.js`.

That approach was superseded by the thin-shell CMS on `main` and never
committed. The branch exists so it is recoverable — **it is not meant to be
merged.** It diverges from `main` by 93 files and predates the migration.

---

## One gotcha worth knowing

The worktree at `.claude/worktrees/project-onboarding-github-00cac9` repeatedly
reset itself to the stale `claude/project-onboarding-github-00cac9` branch
(`03ad04c`, the 45-book state) between sessions. If a checkout suddenly looks
like it lost months of work, check `git branch --show-current` before believing
it — the commits were always safe on `origin/main`. Simplest fix on the new
machine: don't recreate these worktrees, just work in the main clone on `main`.
