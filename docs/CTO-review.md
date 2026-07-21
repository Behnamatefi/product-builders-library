# CTO Review — Library Nav + CMS Templating Migration

**Reviewer:** CTO (final pre-merge holistic review)
**Branch:** `claude/project-onboarding-github-00cac9`
**Date:** 2026-07-22
**Scope reviewed first-hand:** `assets/book.js` (full), `assets/library.js`, `tools/migrate.js`, `tools/verify.js`, `tools/build-manifest.js`, the migrated `01 - Communication/on-writing-well.html`, `index.html` diff, `assets/book.css` (nav/overlay), plus `docs/PRD.md` and `docs/QA-report.md`.

---

## Verdict: APPROVE (ship it) — with follow-ups, none blocking

The two deliverables are real, well-built, and safe to push. The migration is provably lossless, the navigation header works end-to-end and degrades sensibly on mobile, and the code is clean, dependency-free, and defensive. I found **no blocker**. I did surface one content-quality issue and one docs-accuracy issue that the team should fix soon (both below), plus I corroborate the QA nits.

I re-ran the parity proof myself:

```
$ node tools/verify.js
Lossless-parity verification: 45/45 pages passed.
```

I also independently confirmed the proof is genuine, not circular (see next section).

---

## What I verified first-hand

### 1. The parity proof is real (and I resolved a confusing signal)
The session's opening git snapshot said the tree was "clean," which would have made `verify.js` compare migrated-vs-migrated (meaningless). That snapshot was stale. The actual state:

- **git HEAD** (`0b93746`) still holds the **original** self-contained pages — I confirmed `git show HEAD:"01 - Communication/on-writing-well.html"` contains `var DATA = {…}` and a `<style>` block, and **no** `Book.mount`.
- **The working tree** holds the **migrated** shells — `Book.mount(…)`, no `<style>`.
- `git status` shows 45 pages + `index.html` + `README.md` modified, and `assets/`, `tools/`, `docs/` untracked.

So `verify.js` is a true **original-at-HEAD vs migrated-on-disk** diff: content parity (DATA minus the four added keys deep-equals the original DATA), delta parity (method/flow/graph match the originals' hard-coded JS), and shell wiring. 45/45 is trustworthy.

### 2. The dedup actually landed, across all 45
Scripted sweep of all 45 pages: **0** retain a `<style>` block or inline render/graph JS; **all 45** call `Book.mount` and reference `../assets/book.css`, `../assets/book.js`, `../assets/library.js`. Sample page is **57.1 KB** (from ~101 KB); shared assets total **74 KB** and load once. The size and "one source of truth for UI" claims hold.

### 3. Navigation integrity is intact
- All **45** catalog hrefs in `index.html` resolve to real files; all **45** map to a `window.LIBRARY` slug; **0** dangling.
- Reading order is consistent across the three places it is computed — `tools/migrate.js`, `tools/build-manifest.js`, and `assets/book.js` all sort by `groupNum` then `slug.localeCompare`. Prev/Next therefore agree with the manifest, cross group boundaries correctly, and disable the unavailable direction at the endpoints (`aria-disabled`, no `href`).
- `index.html`'s only change is the `pb-theme`/`pb-lang` → `pbl-theme`/`pbl-lang` key rename. This is **correct and necessary**: without it, theme/language would not persist between the catalog and the book pages. Good catch by the implementer.

### 4. Security / XSS
`book.js` renders author content via `innerHTML` throughout (tldr, quotes, media, details, method, node labels), and interpolates `o.url`/`o.id` straight into `href`/`src` without attribute-escaping. For this project that is **acceptable**: the content is single-author, trusted, build-time, and no end-user input ever reaches the DOM. There is no untrusted data path. `migrate.js` correctly refuses to inline any DATA containing `</script`. I would not gate the merge on this. Worth a one-line comment in `book.js` stating the trust assumption so a future contributor doesn't wire user input through the same path.

---

## Findings

### Non-blocking — worth fixing soon

**C1 · Content drift: 23 of 45 Persian book titles disagree between the catalog and the book pages/overlay.**
`index.html` embeds its own hand-authored `GROUPS` array (Persian titles included); `assets/library.js` and each book's `meta.book.fa` are a *separately* authored set. They diverge for **23/45** books, e.g. `storyworthy` → catalog "داستان‌واره" vs page/overlay "داستانی"; `shoe-dog` → "شو داگ" vs "کفش‌باز"; `the-mom-test` → "تستِ مادر" vs "تِستِ مامان". A Persian reader sees one title on the homepage card and a different one after clicking in (and again in the new all-books overlay).
This is the **concrete, present-tense form of the "two sources of truth" risk** that the PRD and QA framed only as a *future* possibility — it is already live. It is **not** a navigation break (English titles and all 45 hrefs are correct and consistent) and **not** introduced by the migration (the book pages are byte-identical to the originals — `verify.js` proves it). It is pre-existing content debt that the new overlay now also surfaces.
*Fix path:* make `index.html` render from `window.LIBRARY` (collapses catalog + overlay to one source; the divergence disappears automatically), or reconcile the two Persian title lists by hand. The former is already tracked as a follow-up — this finding raises its priority from "nice-to-have" to "resolves a live inconsistency."

**C2 · Docs assert an acceptance criterion that is now false.**
`docs/PRD.md` §4.8 lists "✅ `node tools/migrate.js --check` re-validates extraction on all 45 pages" as a passing acceptance criterion. It no longer passes: `migrate.js`'s extractor targets the **original** page format, and the working-tree pages are already migrated, so `--check` throws on the first file (`could not extract: DATA object`, exit 1). QA caught this as F3. The go-forward tool is `tools/build-manifest.js` (idempotent). Before merge, correct the PRD line — mark `migrate.js` as one-shot/pre-migration-only and point ongoing manifest regeneration at `build-manifest.js`. Docs should match reality.

**C3 · No cache-busting on shared assets (design-model risk).**
Pages link `../assets/book.js` / `book.css` with no version query or hash. The whole value proposition is "edit one file, all 45 update" — but returning readers may get a stale cached `book.js` inconsistently across pages after a UI change. First deploy is unaffected (cold cache). Add a `?v=` query (or content hash) at the first UI iteration and note a hard-refresh step. Already flagged in the PRD risk table — I concur; it belongs on the near-term list, not the merge gate.

**C4 · `verify.js` self-invalidates after this commit lands.**
It reads originals via `git show HEAD:…` expecting `var DATA =`. Once these migrated pages are the HEAD, that regex finds nothing and the tool will report failures for everyone who runs it post-merge. That is fine — it is a **one-shot migration proof**, correctly run as the final pre-commit gate — but it must **not** be wired into CI as an ongoing check, and the README/PRD should say so plainly. The PRD risk table already acknowledges this; keep it prominent.

### Non-blocking nits (corroborating QA F1/F2/F4/F6 — verified in source)
- **Overlay group-number badges freeze at mount-time language** (`renderLibraryNav` emits `num(g.num)`; `setLang`/`renderAll` never rebuild the overlay). Switch EN⇄FA and the ۱–۱۵ badges keep their original digits. Emit both digit forms as `data-only` spans. (QA F1)
- **All-books modal has no focus management** — `role="dialog" aria-modal="true"` but focus isn't moved in, trapped, or restored, and `#navAll`'s `aria-expanded` never toggles. Esc/backdrop/close all work, so this is a11y polish, not a functional break. (QA F2)
- **Dead tooltip ternary** in `wire()`: `(LANG === 'fa' ? '' : '') + entry.book.en` — both branches are `''`, and the prev/next title is always the English book name. (QA F4)
- **Prev/Next chevrons are not mirrored under `[dir=rtl]`.** Defensible as "logical prev/next," minor. (QA F6)

---

## Code-quality assessment (for the record)

- **`book.js`** is a clean, self-contained, zero-dependency renderer. Good defensive habits: `window.LIBRARY || []`, `try/catch` around every `localStorage` access, element-existence guards, deterministic (physics-free) graph layout. The DATA-driven model genuinely delivers "edit only DATA" — I traced the `on-writing-well` DATA object end-to-end against what renders.
- **`verify.js`** is a rigorous, readable proof with a real deep-equal and clear failure messages. Good engineering.
- **`migrate.js`** is appropriately paranoid (throws on any missing field, wrong chip/kbox/metastrip counts, invalid JSON, or `</script` in DATA). The split between one-shot `migrate.js` and idempotent `build-manifest.js` is the right shape — it just needs to be documented that way (C2).
- **`book.css`** nav/overlay: sticky `z-index:60` nav, overlay `z-index:200`, sensible responsive breakpoints (`hide-sm` drops prev/next < 640px, All-books label collapses to icon < 900px), `.cur` highlight, `[aria-disabled]` styling. Solid.
- **Docs vs reality:** PRD and QA are largely accurate and honest — they name the cache-busting and two-source risks themselves. The two gaps are C1 (they understated an already-live drift as a future risk) and C2 (a stated acceptance criterion no longer holds).

---

## Recommendation

**Approve and push.** Nothing here should stop the merge. Suggested order after merge: **C1** (make `index.html` read `window.LIBRARY` — kills the 23-title Persian drift and the two-source risk in one move), **C2** (fix the PRD/README wording — 5-minute change, do it before or with the push), then **C3/C4** and the QA nits (F1/F2 first) on the next UI pass.
