# Migrating this project to Claude Code

A step-by-step guide to continue developing the Product Builder's Library in **Claude Code**
(Anthropic's terminal coding agent). One-time setup, then day-to-day commands.

## 0. Prerequisites
- **Node.js ≥ 18** — check with `node -v`. Install from https://nodejs.org if needed.
- **Claude Code** — install once:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- A terminal, and (optionally) the **GitHub CLI** `gh` for pushing.

## 1. Get the project onto your machine
You already have it in your **Product Books** folder, and it's now a complete repo (site + `tools/` +
`CLAUDE.md`). Either work in that folder directly, or clone your GitHub copy:
```bash
git clone https://github.com/Behnamatefi/product-builders-library.git
cd product-builders-library
```

## 2. Install the dev dependency (for verification)
The build needs nothing; the headless verifier (`tools/vbook.js`) needs Playwright:
```bash
npm init -y            # if there's no package.json yet
npm i -D playwright
npx playwright install chromium
```

## 3. Open it in Claude Code
From the project folder:
```bash
claude
```
Claude Code automatically reads **`CLAUDE.md`**, so it will understand the architecture, the
bilingual + RTL/RLM conventions, and how to build a book. Try:
- *"Edit the Persian on the Storyworthy page to be warmer, then rebuild and verify it."*
- *"Add a new book X to the Strategy group."*
- *"Regenerate the catalog after I edit a config."*

## 4. Day-to-day build commands
Edit a book's content, then rebuild + verify it:
```bash
node tools/buildbook.js tools/configs/<slug>.js "NN - Group/<slug>.html"
node tools/vbook.js "NN - Group/<slug>.html"        # errs [] and leak [] = good
```
Mark a book "live" (green) in the catalog:
```bash
node tools/patchcatalog.js "Exact English Title|NN - Group/<slug>.html"
```
Preview anything by opening `index.html` (or a book page) in your browser — no server needed.

## 5. Commit & push your changes
```bash
git add -A
git commit -m "Describe your change"
git push
```

## Notes
- Slugs = the book's file name without `.html` (e.g. `on-writing-well`).
- The `tools/engine.html` template already includes the shared "‹ Library" back-link, so every
  book you build links home to the catalog automatically.
- Don't hand-insert Persian RLM marks or Persian digits into configs — the page adds them at render time.
- See `CLAUDE.md` for the full conventions and the per-book config shape.
