# QA Report — CMS Templating Migration + Library Nav Header

**Project:** The Product Builder's Library (45 bilingual EN/فارسی book knowledge-graph pages)
**Scope under review:** (1) shared-asset migration of all 45 pages to thin `Book.mount(DATA)` shells; (2) library navigation header (Home / Prev / Next / All-books overlay).
**Branch:** `claude/project-onboarding-github-00cac9`
**Date:** 2026-07-22
**Reviewers:** 3 independent slice audits (Groups 01–05, 06–10, 11–15), synthesized by QA lead.

---

## BLOCKERS

**None.** Nothing prevents merge. No blocker- or major-severity finding was raised by any of the three slices, and the parity proof is green for all 45 pages.

---

## Overall Verdict

**PASS-WITH-NITS** — the migration is provably lossless across all 45 pages (`verify.js`: 45/45) and the nav header works end-to-end including cross-group and first/last-book edge cases; the only open items are 3 minor and 3 nit-level polish issues, all cosmetic/non-functional and none blocking.

All three slices independently returned `pass-with-nits`, in agreement.

---

## Parity Evidence (verify.js)

`node tools/verify.js` — re-run by QA lead on this branch, exit code 0:

```
Lossless-parity verification: 45/45 pages passed.
✓ Every migrated page preserves its original DATA exactly, plus the migrated method/flow/graph constants match the originals.
```

This is a genuine **original-vs-migrated** diff, not migrated-vs-migrated: `verify.js` reads each original 904-line self-contained page from `git show HEAD` (commit `0b93746`) and deep-equals it against the migrated shell's `Book.mount` DATA, additionally checking the four migrated constants (method text, flow words, graph W/H/R1/R2/span) against the originals' hard-coded JS. The git HEAD copies were independently confirmed to be the pre-migration format (contain `<style>`, `netsvg` refs, no `Book.mount`/`#app`), so 45/45 reflects a real parity proof.

---

## Findings (deduped across all three slices, sorted by severity)

Counts: **0 blockers · 0 majors · 3 minors · 3 nits** (plus praise, listed separately).

| # | Severity | Area | File | Summary | Raised by |
|---|----------|------|------|---------|-----------|
| F1 | Minor | i18n | `assets/book.js` | **All-books overlay group-number badges (`.lgn`) don't update on language toggle.** The overlay grid is built once from `mount()` via `renderLibraryNav` (~L213), emitting `num(g.num)` (~L248) with digits baked to the mount-time language. `setLang`/`renderAll` (L596–611) never rebuild the overlay. Pages boot in Farsi by default, so badges render as Farsi numerals ۱–۱۵ and stay Farsi even after switching to English (and vice-versa). Everything else in the overlay localizes correctly via data-only en/fa spans. Fix: emit both digit forms as data-only spans, or re-run number formatting on `setLang`. | Slices 1, 2 |
| F2 | Minor | a11y | `assets/book.js` | **All-books modal has no focus management.** Overlay is declared `role="dialog" aria-modal="true"` (~L124) but open/close only toggle a CSS class (L254–262): focus is not moved into the sheet on open, not trapped while open (keyboard/AT users can Tab into the page behind), and not restored to the `#navAll` trigger on close. `#navAll` has `aria-haspopup="dialog"` but its `aria-expanded` is never toggled. Esc + backdrop-click close work and the closed state is `display:none` (not exposed to AT while hidden), so impact is keyboard/SR polish, not a functional break. Fix: move focus to `#libClose` on open, trap Tab within `.libsheet`, restore focus on close, toggle `aria-expanded`. | Slices 1, 2, 3 |
| F3 | Minor | tooling | `tools/migrate.js` | **`node tools/migrate.js --check` throws and exits 1 post-migration.** The project notes present `--check` as a runnable re-validation, but it fails on the first file: `Error: [01 - Communication/nobody-wants-to-read-your-shit.html] could not extract: DATA object` (exit 1). The extractor regex targets the ORIGINAL self-contained format; the working-tree pages are already migrated to `Book.mount({...})`, so extraction fails. It reads from disk (not git HEAD), so it is non-idempotent by design and only runs on un-migrated pages. **Not a shipped-page defect** — `verify.js` is the real parity proof and passes 45/45 — but the documented `--check` command is currently non-functional. Confirmed reproduced by QA lead (exit 1). | Slice 3 |
| F4 | Nit | i18n | `assets/book.js` | **Prev/Next tooltip is always English via a dead no-op ternary.** In `renderLibraryNav`'s `wire()` (~L224): `btn.setAttribute('title', (LANG === 'fa' ? '' : '') + (entry.book.en))`. The ternary evaluates to `''` in both branches (dead code) and the title always uses `entry.book.en`, so in Persian mode the prev/next hover tooltip shows the English title. Low impact (prev/next are hidden below the mobile breakpoint), but it reads as an unfinished localization stub. Fix: drop the branch or use `LANG === 'fa' ? entry.book.fa : entry.book.en`. | Slices 1, 2, 3 |
| F5 | Nit | i18n | `assets/book.js` | **Sticky-nav `.brand` label is English-only in both languages.** `renderShell` (~L105) emits the brand as `esc0(m.book.en)`, so in Persian/RTL the brand still reads the English title. **Pre-existing, NOT a migration regression** — verified against git HEAD that the original pages also hard-coded the English brand with no data-only spans, so this is faithful to the source design. `.brand` is `display:none` below the mobile breakpoint. Flagged only for the record; safe to leave as-is for parity. | Slice 1 |
| F6 | Nit | rtl | `assets/book.js` | **Prev/Next chevrons are fixed-direction, not mirrored for RTL.** `IC.prev` is a left-pointing chevron and `IC.next` a right-pointing chevron, rendered identically regardless of `dir`. In Persian/RTL the arrows don't mirror to match reading direction, which can read slightly backwards to RTL users. Defensible as a "logical prev/next" choice; low impact. Fix if strict RTL fidelity desired: mirror transform under `[dir=rtl]`. | Slice 3 |

### Cross-slice consolidation note
- **F1** raised identically by Slices 1 & 2. **F2** raised by all three. **F4** raised by all three. Consensus on these three items strengthens confidence they are real (not slice-local artifacts).
- **F3** (migrate.js `--check`) surfaced only in Slice 3 but independently reproduced during this synthesis.
- **F5** is explicitly a pre-existing source-design choice, preserved faithfully by the migration — not new-code debt.

---

## Praise (verified strengths)

| Area | Summary |
|------|---------|
| Parity | Migration is genuinely lossless across all 45 pages. Every slice DATA object evals cleanly; part↔chapter cross-references resolve; custom per-book graph viewBox (W/H/R1/R2/span) is honored over the shell placeholder; English-only sticky-nav brand matches git HEAD byte-for-byte. `library.js` manifest is well-formed (45 entries, ordered by groupNum then slug, no duplicate slugs, all target files exist). |
| Nav header | Works end-to-end including edge cases: Home → `../index.html`; Prev/Next follow reading order and correctly cross group boundaries (e.g. `the-lean-startup` next → `../14 - Career/7-rules-of-power.html`); the last book in `LIBRARY` (`subtle-art`) has `aria-disabled="true"` next with no href. All-books overlay renders 15 groups × 3 books with exactly one `.cur` highlight, opens via `navAll`, closes via Esc and backdrop click. |
| i18n / persistence | data-only en/fa span pairs used throughout; toggling flips `data-lang` + `dir` (fa/rtl ↔ en/ltr) and re-renders the graph. Theme + language persist across full-page navigation via the unified `pbl-lang` / `pbl-theme` localStorage keys (confirmed carrying `lang=en, theme=light` from one book to another). |

---

## What Was Tested vs Not Tested

**Automated / proven for all 45:**
- Lossless parity vs git HEAD original (`verify.js` → 45/45, re-run and confirmed exit 0).
- Thin-shell structure per page (0 `<style>` blocks, 0 inlined render/graph JS, `<div id="app">`, loads shared `book.css` + `library.js` + `book.js`, calls `Book.mount`).
- Manifest well-formedness: 45 entries, ordered, no duplicate slugs, all target files exist; `meta.slug`===filename and `meta.groupNum`===folder for every page.
- Node-harness structural eval of every page's inline DATA (5 parts, 15–16 chapters, 5 stages, valid graph object, intact part↔chapter cross-references).

**Spot-checked in a browser (not exhaustive across all 45):**
- Interactive graph render + node/link counts (e.g. 22 nodes/21 links for a 5-part book; 21/20 for a 15-chapter book), node-focus dimming, 5 ladder rungs, quotes/media cards, structured map, stage nav — on `the-lean-startup`, `subtle-art`, `creativity-inc`, `amp-it-up`, and others; zero console errors.
- Nav header behaviors, cross-group Prev/Next, first/last-book edge cases, all-books overlay open/close.
- Bilingual EN/LTR ↔ FA/RTL toggling and theme/language persistence across navigation.
- (Per project notes) interactive graph drag / scroll-spy were spot-checked in the browser on the main thread, not swept across all 45.

**Not tested / out of scope this pass:**
- Full WCAG accessibility audit (F2 identifies the main gap: modal focus management).
- Exhaustive per-page browser render of all 45 (sampled, not swept).
- The `migrate.js --check` re-validation path — found non-functional post-migration (F3); parity is instead proven by `verify.js`.
- Performance/network validation of the "load once, cache across 45" claim (asset extraction confirmed structurally, not benchmarked).

---

## Recommendation

Approve for merge. None of the six findings block. Suggested follow-up ordering: **F1** and **F2** (user-observable overlay i18n + a11y polish) first; **F3** as a tooling/docs fix (repoint `--check` at git HEAD, or document it as pre-migration-only); **F4/F5/F6** as low-priority polish.
