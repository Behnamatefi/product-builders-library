# The Product Builder's Library — ‏کتابخانهٔ سازندهٔ محصول‏

Bilingual (English / فارسی) interactive **knowledge-graph** summaries of **45 essential books for product builders**, organized into **15 skill groups** — based on Lenny Rachitsky's two-part *"Essential books for product builders"* reading list.

‏کتابخانه‌ای دوزبانه از خلاصهٔ ۴۵ کتابِ ضروری برای سازندگانِ محصول، در قالبِ نقشهٔ دانشِ تعاملی — ساده، خواندنی، و برای یادگیری.‏

## What's inside

Open **[`index.html`](index.html)** for the catalog. It opens with a centered-logo
header, and a **“Find my reading path”** wizard — answer two quick questions
(your seniority, what you want to get better at, and how much time you have) and it
builds a **sorted reading flow** from the 45 books. On desktop it's a modal; on mobile
it's a bottom sheet.

Click any book to open its page. Each page is offline-ready and gives you:

- an **interactive radial knowledge graph** you click through;
- the book taught in **5 learning stages**, from over-simplified to expert;
- click-to-grow nodes with in-depth detail, real examples, verified quotes, and a video or two;
- a **library navigation header** — jump home, step to the previous/next book, or open the **“All books”** overlay to reach any of the 45 pages, grouped by the 15 skill groups;
- an **EN / فارسی** language toggle and a **dark / light** theme toggle (both remembered across the whole library).

These are learning aids, not replacements for the books. If a book helps you, buy it and read it.

Under the hood the pages share a single stylesheet and runtime (`assets/`), so each page ships only its **content** — see [Project structure](#project-structure) and [Editing & adding books](#editing--adding-books-the-cms) below.

## The 15 groups

1. **Communication** — Nobody Wants to Read Your Sh\*t · On Writing Well · Storyworthy
2. **Executing** — The Great CEO Within · Scaling People · The Goal
3. **Strategy** — Good Strategy / Bad Strategy · Playing to Win · Working Backwards
4. **Inspiration** — The Making of Prince of Persia · Build · Shoe Dog
5. **Managing** — High Output Management · The Making of a Manager · Radical Candor
6. **Leadership** — Amp It Up · The 15 Commitments of Conscious Leadership · The Score Takes Care of Itself
7. **Product Success Rate** — The Mom Test · Escaping the Build Trap · Continuous Discovery Habits
8. **Product Org** — Empowered · Inspired · Thinking in Bets
9. **Sales & Marketing** — Purple Cow · Obviously Awesome · Founding Sales
10. **Design** — Don't Make Me Think · The Design of Everyday Things · Refactoring UI
11. **Taste & Craft** — The War of Art · The Work of Art · Creativity, Inc.
12. **Influence** — How to Win Friends and Influence People · Influence · Never Split the Difference
13. **Starting a Company** — The Lean Startup · Crossing the Chasm · Fall in Love with the Problem
14. **Career** — Great at Work · 7 Rules of Power · The Effective Executive
15. **Happiness** — The Subtle Art of Not Giving a F\*ck · A Guide to the Good Life · Stumbling on Happiness

## How to use

Clone or download, then open `index.html` in any modern browser. Everything runs locally — no build step, no server, no dependencies (fonts load from a CDN when online).

```
git clone https://github.com/Behnamatefi/product-builders-library.git
cd product-builders-library
open index.html
```

The book pages load `assets/book.css` + `assets/book.js` by relative path, so they work straight from the filesystem — no server needed. (Fonts still come from a CDN when you’re online.)

## Project structure

```
├── index.html                 # catalog / landing page
├── assets/
│   ├── book.css               # shared styles for every book page
│   ├── book.js                # shared runtime — renders a page from its DATA (Book.mount)
│   ├── library.js             # generated manifest of all 45 books (nav header + wizard)
│   ├── recommend.js           # "Find my reading path" wizard (modal / bottom-sheet)
│   └── recommend.css          # wizard styles
├── tools/
│   ├── migrate.js             # one-shot: legacy self-contained pages → shared-asset pages
│   ├── build-manifest.js      # (re)generate assets/library.js from the pages — idempotent
│   └── verify.js              # prove a migration is lossless vs the previous git commit
└── NN - Group/slug.html       # 45 book pages (15 groups × 3), each = a thin shell + its DATA
```

Every book page is a thin shell that ends with:

```html
<div id="app"></div>
<script src="../assets/library.js"></script>
<script src="../assets/book.js"></script>
<script>Book.mount({ /* this book's DATA */ });</script>
```

All presentation lives in the two shared `assets/` files; the page carries only the
`DATA` object (hero/meta, the knowledge-graph nodes, the 5 stages, quotes, media, etc.).

## Editing & adding books (the CMS)

- **Edit a book** — open its `NN - Group/slug.html` and change the fields inside the
  `Book.mount({ … })` object. Nothing else to touch; the shared runtime re-renders it.
- **Restyle everything** — edit `assets/book.css` or `assets/book.js` once; all 45 pages update.
- **Add a book** — copy an existing page, swap in the new `DATA` (keep `meta.slug`,
  `meta.folder`, `meta.groupNum`, `meta.group`, `meta.book` accurate), then refresh the
  navigation manifest:

  ```
  node tools/build-manifest.js     # rebuilds assets/library.js (the All-books nav)
  ```

- **Tune the wizard** — book tags live in `assets/recommend.js` (`GROUP_TAGS` per group,
  `OVERRIDES` per book); edit them to reshape the suggested reading flow.

A full step-by-step for editing, adding books, and deploying is in
**[`docs/GUIDE.md`](docs/GUIDE.md)**.

## Credits

Created by **Behnam Atefi** — [LinkedIn](https://www.linkedin.com/in/behnamatefi/).
Book selection from Lenny Rachitsky's *Essential books for product builders* (parts 1 & 2).
