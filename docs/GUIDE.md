# Maintenance & Deploy Guide

Everything you need to run, edit, extend, and ship **The Product Builder's Library**.
No build step, no dependencies — plain HTML/CSS/JS.

---

## 1. Preview locally

The site is static. Any static file server works. Two options:

```bash
# from the repo root
python3 -m http.server 8000
```
Then open <http://localhost:8000/>.

Or, inside Claude Code, start the saved server (`.claude/launch.json` → `static-site`).

> Tip: serve over **http://** rather than opening `file://` directly — the shared
> `assets/*.js` load more reliably over HTTP and it matches production.

---

## 2. Edit a book's content

Each book page is a thin shell; all its content is in one inline `DATA` object.

1. Open `NN - Group/<slug>.html` (e.g. `05 - Managing/high-output-management.html`).
2. Edit the `window.DATA = { … }` object near the bottom. Every user-facing string
   is bilingual: `{ "en": "...", "fa": "..." }`.
3. Save and refresh the browser. No rebuild needed.

You never touch `assets/book.css` or `assets/book.js` to edit a book.

---

## 3. Change the look or behavior of ALL books

Because the 59 pages share the same runtime, edit once:

- **Styles** → `assets/book.css`
- **Rendering / interactions / nav / masthead** → `assets/book.js`
- **Catalog page** (`index.html`) has its own inline `<style>`; the masthead CSS is
  duplicated there so update both if you change the masthead.

---

## 4. Add a new book

1. Create `NN - Group/<slug>.html`. Easiest: copy an existing book page and replace
   its `window.DATA`. Keep `DATA.meta.slug` equal to the filename (without `.html`).
2. Add the book to the `GROUPS` array in `index.html` (title, author, `why`, `href`).
3. Regenerate the manifest so prev/next, the all-books overlay, and the wizard see it:
   ```bash
   node tools/build-manifest.js
   ```
4. Preview and confirm the new page renders and appears in the catalog + wizard.

---

## 5. Tune the "Find my reading path" wizard

Recommendations are driven by a small tag layer in `assets/recommend.js`:

- `GROUP_TAGS` — per skill group: `intents`, seniority `snr`, reading `len` (1–3).
- `OVERRIDES` — per book slug, only where a book differs from its group
  (e.g. mark a foundational book `core: true`, or a short read `len: 1`).

Change those tables to reshape the suggested reading flow. Time buckets
(quick ≈ 3, balanced ≈ 5, deep ≈ 8 books) live in `TIMES` in the same file.

---

## 6. Ship it (commit & push to GitHub)

```bash
# 1. see what changed
git status

# 2. stage everything
git add -A

# 3. commit
git commit -m "Add reading-path wizard + centered-logo masthead"

# 4. push the current branch
git push -u origin HEAD
```

Then open a Pull Request on GitHub and merge into `main` (or push straight to `main`
if that's your workflow).

### Publish with GitHub Pages (optional)
1. GitHub → repo **Settings → Pages**.
2. **Source:** Deploy from a branch → **Branch:** `main` → **Folder:** `/ (root)`.
3. Save. The site goes live at `https://<user>.github.io/<repo>/` in a minute or two.

No build action is required — GitHub serves the files as-is.

---

## 7. Tooling notes
- `tools/build-manifest.js` — the go-forward tool; safe to re-run anytime.
- `tools/migrate.js` — one-shot original→shell migration. **Already done; do not
  re-run** on migrated pages.
- `tools/verify.js` — one-shot pre-commit parity proof (working tree vs git HEAD).
  It self-invalidates once the migration is committed, so **don't wire it into CI.**

## 8. Good to know
- Theme + language are remembered across the whole library via `localStorage`
  keys `pbl-theme` / `pbl-lang`.
- There is **no cache-busting** on `assets/*` yet. After you change `book.js`/`book.css`,
  returning visitors may see a cached copy. When you start iterating on the shared UI,
  add a `?v=<n>` query to the asset links (or a content hash).
