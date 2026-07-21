# Feature Requests & Backlog

Itemized backlog for The Product Builder's Library. **Section A** documents the features already shipped on this branch as user stories with acceptance criteria (a done-log / requirements record). **Section B** lists proposed future work.

Legend: personas are **Reader** (browses and learns), **Content editor** (authors/edits a book's content), and **Maintainer** (owns the shared UI + tooling).

---

## A. Shipped features (done-log)

### A1 — Return to the catalog from any book
**As a Reader,** I want a Home button on every book page so I can get back to the full catalog without using the browser back button.
- **AC1** A Home control is visible in the sticky nav on all 45 pages.
- **AC2** It links to `../index.html`.
- **AC3** It works in both EN/LTR and فارسی/RTL and in both themes.

### A2 — Move to the next / previous book
**As a Reader,** I want Previous and Next buttons so I can read through the library in order without returning to the catalog each time.
- **AC1** Reading order is group number ascending, then slug ascending; Next/Prev walk this single sequence across group boundaries.
- **AC2** On the first book, Previous is disabled; on the last book, Next is disabled (no dead links).
- **AC3** Next from the last book of a group lands on the first book of the next group.
- **AC4** Targets are derived from the manifest (`window.LIBRARY`), not hand-coded per page.

### A3 — Browse the whole library in an overlay
**As a Reader,** I want an "All books" button that opens a browser of every group and book so I can jump anywhere in one click.
- **AC1** The overlay lists all 15 skill groups × 3 books, grouped and ordered by `groupNum`.
- **AC2** Each group shows its number, its bilingual name, and its three book links.
- **AC3** The book I opened it from is visually highlighted as current.
- **AC4** Any link navigates directly to that book's page.
- **AC5** The overlay closes via the close button, a backdrop click, and the **Esc** key.
- **AC6** All text is bilingual and renders correctly in RTL and dark mode.

### A4 — Remember my language and theme across the library
**As a Reader,** I want my language and light/dark choice to persist as I move between books so I set it once.
- **AC1** Theme and language are stored under unified keys `pbl-theme` / `pbl-lang`.
- **AC2** A pre-paint boot script applies the stored theme/language/direction before first render (no flash of wrong theme or direction).
- **AC3** OS `prefers-color-scheme` changes are honored only when the user hasn't set an explicit theme.
- **AC4** Setting language/theme on one page and navigating to another preserves the choice.

### A5 — Edit a book by touching only its content
**As a Content editor,** I want each page to contain only its content (a single `DATA` object) so I can edit a book without wading through ~700 lines of shared CSS/JS.
- **AC1** All shared styling lives in `assets/book.css`; all shared behavior/rendering in `assets/book.js`.
- **AC2** A book page is a thin shell that loads the shared assets and calls `Book.mount(DATA)`.
- **AC3** Changing a book's content requires editing only that page's `DATA` object.
- **AC4** `DATA` conforms to the schema in [`PRD.md` §5](PRD.md#5-the-data-schema-contract).

### A6 — Change the UI once for all books
**As a Maintainer,** I want a single source of truth for the UI so a style or behavior change applies to all 45 pages from one edit.
- **AC1** Editing `book.css` restyles all pages; editing `book.js` changes structure/behavior for all pages.
- **AC2** No page duplicates shared CSS/JS.
- **AC3** Shared assets load once and cache across the library (~75 KB total).

### A7 — Migrate all 45 pages losslessly
**As a Maintainer,** I want a one-shot migrator that converts the legacy monoliths to shells so I don't hand-edit 45 files.
- **AC1** `node tools/migrate.js --check` validates extraction on all 45 pages and writes nothing.
- **AC2** `--write` rewrites every page as a shell and regenerates `assets/library.js`.
- **AC3** Migration lifts the inline `DATA`, the four deltas (method / flow / graph geometry), and all hero/meta strings into one augmented `DATA`.
- **AC4** The migrator fails loudly on any un-extractable field, invalid JSON, wrong chip/kbox/metastrip counts, or a `</script` in serialized `DATA`.

### A8 — Prove the migration changed nothing
**As a Maintainer,** I want a mechanical parity proof so I can trust that no content was lost or altered.
- **AC1** `node tools/verify.js` compares each migrated page against the original at git HEAD.
- **AC2** It asserts content parity (DATA minus the four added keys deep-equals the original), delta parity (method/flow/graph match the original hard-coded JS), and shell wiring (asset refs + essential meta present).
- **AC3** Result: **45/45 pages pass**; any drift exits non-zero and prints the first mismatch.

### A9 — Generated, single-source manifest
**As a Maintainer,** I want the 45-book manifest generated from the pages so navigation data can't silently drift from reality.
- **AC1** `assets/library.js` (`window.LIBRARY`) is emitted by `migrate.js`, not hand-maintained.
- **AC2** Each entry is `{slug, folder, groupNum, group{en,fa}, book{en,fa}}`.
- **AC3** The manifest is sorted by `groupNum`, then slug — the same order used for prev/next.

---

## B. Future feature requests

### B1 — Generate `index.html` from the manifest *(high value)*
**As a Maintainer,** I want the catalog page built from `window.LIBRARY` so the library has one source of truth and adding a book updates the catalog automatically.
- Today `index.html` carries its own embedded book list and does not read the manifest — a second source of truth that can drift.
- **AC** `index.html` renders its grid from `window.LIBRARY`; adding a book to the manifest surfaces it in the catalog with no separate edit.

### B2 — Search / filter inside the all-books overlay
**As a Reader,** I want to type in the overlay to filter books (by title or group) so I can find one among 45 fast.
- **AC** A search field filters the overlay list live, in both EN and فارسی; clearing it restores the full grouped list; keyboard-navigable.

### B3 — Per-book Open Graph / social images
**As a Reader who shares a link,** I want each book page to have its own preview image and metadata so shared links look intentional.
- **AC** Each page emits `og:title` / `og:description` / `og:image` from `DATA.meta`; a per-book OG image (or a generated one) is referenced.

### B4 — Cache-bust shared assets on release
**As a Maintainer,** I want versioned shared-asset URLs so a UI update never serves a stale cached `book.js`/`book.css`.
- **AC** Pages reference `book.js?v=<hash>` / `book.css?v=<hash>` (or equivalent), updated on each UI release.

### B5 — "Add a book" scaffold
**As a Content editor,** I want a command that scaffolds a new book shell with an empty `DATA` skeleton and refreshes the manifest so adding a book is one step, not a manual two-step.
- **AC** A tool creates `NN - Group/slug.html` from the schema skeleton and regenerates `library.js` so the book immediately appears in prev/next and the overlay.

### B6 — Keyboard navigation between books
**As a Reader,** I want arrow-key shortcuts (respecting RTL) to move to the previous/next book so I can page through hands-free.
- **AC** A configurable shortcut triggers prev/next using the same manifest order; direction respects the active `dir`.

### B7 — Overlay accessibility polish
**As a Reader using a keyboard or screen reader,** I want the all-books overlay to trap focus and restore it on close so the modal is fully accessible.
- **AC** Focus moves into the overlay on open, is trapped while open, and returns to the "All books" trigger on close; the dialog is announced.

### B8 — Prev/Next on small screens
**As a mobile Reader,** I want prev/next access on small screens (currently hidden via `hide-sm`) so I'm not limited to Home + All books on mobile.
- **AC** A mobile-appropriate prev/next affordance is available without crowding the nav.

### B9 — Schema validation for `DATA`
**As a Content editor,** I want a validator that checks a page's `DATA` against the schema so I catch a missing/mis-typed field before it renders blank.
- **AC** A tool validates required fields, `{en,fa}` pairs, part/chapter key integrity (every `part.chapters[]` key exists; every `chapter.part` resolves), and stage count = 5; it reports the offending path.
