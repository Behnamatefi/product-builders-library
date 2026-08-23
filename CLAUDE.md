# CLAUDE.md — Product Builder's Library

Guidance for Claude Code (and humans) working in this repo.

## What this is
A bilingual (English / فارسی) library of **45 book summaries for product builders**, each an
**interactive knowledge-graph learning page**, plus a master **catalog** (`index.html`) with a
recommendation wizard. Books are grouped into 15 skill folders (`01 - Communication` … `15 - Happiness`).

## Layout
- `index.html` — the catalog. Contains: the header (centered logo + Home nav), the hero + a
  "Find your reading path" **wizard**, and all books. Its data lives in the `GROUPS` array and the
  wizard's `BOOKMETA` / `INTENTS` objects inside the page's `<script>`.
- `NN - <Group>/<slug>.html` — one self-contained page per book (15 folders × 3 books).
- `tools/`
  - `engine.html` — the page template (a real book page whose content buildbook replaces). It already
    contains the shared "‹ Library" nav link, so every book built from it links back to the catalog.
  - `configs/<slug>.js` — per-book content (bilingual). One file per book.
  - `buildbook.js` — injects a config into `engine.html` → a finished book page.
  - `patchcatalog.js` — flips a book to "live" (green) in `index.html` (idempotent).
  - `vbook.js` — headless verification (node/link counts, In-depth rows, Persian digit leaks).
- `docs/` — the Claude Code migration guide. `README.md` — public-facing readme.

## Core conventions — READ BEFORE EDITING
1. **Bilingual everywhere.** Every user-facing string is `{en:"…", fa:"…"}`. Never ship one language only.
2. **RTL Persian uses automatic U+200F (RLM).** The page helpers `rlm()` / `faText()` wrap Latin runs
   and digits with the RIGHT-TO-LEFT MARK at render time so mixed text stays readable. **Write plain
   Persian in configs — do NOT hand-insert RLM.** (Keeping RTL text readable with U+200F is a standing preference.)
3. **Persian digits** (۰۱۲…) are produced automatically by `faDigits()`. Don't hardcode them in dynamic values.
4. **Persian tone:** plain, warm, conversational — short everyday sentences, not formal or literary.
5. **Config escaping:** configs are plain Node modules. Use **double-quoted** JS strings; **never** write
   a backslash-apostrophe (`\'`) — it breaks `require()`. Use `<b>…</b>` / `<i>…</i>` for emphasis.
6. **Theming:** dark/light via CSS variables (the `--` tokens). Never hardcode colors.

## Edit an existing book
1. Edit `tools/configs/<slug>.js`.
2. Rebuild:  `node tools/buildbook.js tools/configs/<slug>.js "NN - Group/<slug>.html"`
3. Verify:   `node tools/vbook.js "NN - Group/<slug>.html"`  → `errs` must be `[]`, `leak` must be `[]`.

## Add a new book
1. `tools/configs/<slug>.js` — copy the closest existing config and rewrite every value (5 parts, ~15
   leaves, keep all keys). Match the config shape below.
2. Build it into its group folder (command above).
3. Register it in the catalog: in `index.html`, add a book object to the right group in `GROUPS`
   (`{live:true, href:"NN - Group/<slug>.html", en:{…}, fa:{…}}`), and add
   `BOOKMETA["<slug>"] = ["<levels>", <priority>]` so the wizard can recommend it
   (levels = any of `j`/`m`/`s`/`g`; priority 1 = most foundational).
4. Verify the catalog renders and the wizard still returns results.

## Config shape (per book)
`module.exports = { slug, brand, titleTag, W, H, R1, R2, span, leafKickEn, leafKickFa, flowEn, flowFa,`
`hero, callout, kpis, mapcallout, methodEn, methodFa, data:{ tldr[5], parts[~5], chapters{…}, core,`
`stages[5], quotes[], media[], go[], recs[] } }`. Open any file in `tools/configs/` for the full example.

## Requirements
Node ≥ 18. Verification needs Playwright: `npm i -D playwright && npx playwright install chromium`.

Credits: Behnam Atefi. Book selection from Lenny Rachitsky's "Essential books for product builders."
