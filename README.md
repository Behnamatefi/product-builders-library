# The Product Builder's Library — ‏کتابخانهٔ سازندهٔ محصول‏

Bilingual (English / فارسی) interactive **knowledge-graph** summaries of **45 essential books for product builders**, organized into **15 skill groups** — based on Lenny Rachitsky's two-part *"Essential books for product builders"* reading list.

‏کتابخانه‌ای دوزبانه از خلاصهٔ ۴۵ کتابِ ضروری برای سازندگانِ محصول، در قالبِ نقشهٔ دانشِ تعاملی — ساده، خواندنی، و برای یادگیری.‏

## What's inside
Open **[`index.html`](index.html)** for the catalog. From there you can:

- browse all 45 books across 15 groups, each a green **Ready** link;
- use **"Find your reading path"** — a 2-step wizard (your level → your focus + time) that returns a **ranked, personalized reading list**;
- open any book: an **interactive radial knowledge graph**, the book taught in **5 stages** (over-simplified → expert), click-to-grow nodes with in-depth detail, examples, verified quotes, and a video or two.

Every page has an **EN / فارسی** toggle, a **dark / light** theme, a centered-logo header, and a "‹ Library" link back to the catalog. Everything runs locally — no build step, no server.

These are learning aids, not replacements for the books. If a book helps you, buy it and read it.

## The 15 groups
1. **Communication** · 2. **Executing** · 3. **Strategy** · 4. **Inspiration** · 5. **Managing** · 6. **Leadership** · 7. **Product Success Rate** · 8. **Product Org** · 9. **Sales & Marketing** · 10. **Design** · 11. **Taste & Craft** · 12. **Influence** · 13. **Starting a Company** · 14. **Career** · 15. **Happiness**

## Use it
```bash
git clone https://github.com/Behnamatefi/product-builders-library.git
cd product-builders-library
open index.html
```

## Develop it
The pages are generated from small per-book config files by a tiny Node pipeline in [`tools/`](tools/).
See **[`CLAUDE.md`](CLAUDE.md)** for the architecture and conventions, and
**[`docs/MIGRATE-TO-CLAUDE-CODE.md`](docs/MIGRATE-TO-CLAUDE-CODE.md)** to continue building in Claude Code.

```bash
# edit a book, then rebuild + verify it:
node tools/buildbook.js tools/configs/<slug>.js "NN - Group/<slug>.html"
node tools/vbook.js "NN - Group/<slug>.html"
```

## Credits
Created by **Behnam Atefi** — [LinkedIn](https://www.linkedin.com/in/behnamatefi/).
Book selection from Lenny Rachitsky's *Essential books for product builders* (parts 1 & 2).
