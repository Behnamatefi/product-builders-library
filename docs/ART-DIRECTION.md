# ART DIRECTION — "Reading Instrument"

> The incoming design direction for the Product Builder's Library.
> Reference basis: 10 client images — black-canvas calendar & HUD widgets, dot-matrix
> font specimens, terminal/crypto landing pages, international-orange brutalist
> posters, industrial product documentation, ASCII-render editorial dark.
>
> One sentence: **a reading instrument, not a magazine** — near-black panel,
> one international-orange signal, grotesk display, a monospace annotation layer
> over everything, and data-textures (dots, ticks, hairline grids) instead of
> decoration.

---

## 1 · Vision

The library becomes a precision instrument for reading books: a near-black canvas
on which every book is presented like a flight recorder readout — big confident
grotesk headlines, a monospace layer of uppercase micro-labels and tabular numerals
annotating everything ("GROUP 03 // STRATEGY", "45 BOOKS · 16 GROUPS", "STAGE 2/5"),
hairline rules instead of shadows, and exactly one color: international orange
(#FF4514), spent the way an instrument panel spends a warning lamp — on what is
*live, current, or important right now* — the active tab, the core node of the
knowledge graph, the progress you've made, the one hero surface. Persian remains
first-class: Vazirmatn carries all FA text with the same annotation hierarchy
expressed through weight, size, and hairline rules rather than fake uppercase or
letterspacing. The result should feel like the calendar app and the HUD clock from
the references: enormous breathing black space, total typographic confidence, and
data-texture (dot matrices, ruler ticks, hairline grids) as the only ornament.

---

## 2 · Palette

All values land in the **existing CSS custom properties** (`--bg`, `--card`,
`--accent`, `--line`, `--c-*` …) in three places: `index.html` inline tokens,
`assets/book.css`, `assets/recommend.css` (recommend.css inherits — only
book/index define tokens). Do not rename tokens; remap them. One new token family
is introduced: `--sig` (signal orange).

### 2.1 Dark theme (default canvas — the brand)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0A0A0A` | Page canvas. Near-black, neutral (not warm). |
| `--bg2` | `#111110` | Raised band / alternating section. |
| `--card` | `#161514` | Card surface (event-card gray of ref 1). |
| `--card2` | `#211F1D` | Inset surface, chips-on-card, badge plates. |
| `--ink` | `#F4F3F0` | Primary text. Off-white, never pure #FFF for body. |
| `--mut` | `#A8A49C` | Running text. |
| `--mut-soft` | `#6E6A63` | Captions, disabled, inactive dots. |
| `--line` | `#262523` | Default hairline. |
| `--line-soft` | `#1C1B1A` | Faint grid hairline (texture-grade). |
| `--line-strong` | `#3A3835` | Interactive borders, outline pills. |
| `--accent` | `#F4F3F0` | **Primary CTA pill fill** (white pill of refs 4/9/10). |
| `--accent-active` | `#FFFFFF` | CTA press/hover. |
| `--accent-ink` | `#0A0A0A` | Text on the CTA pill. |
| `--sig` | `#FF4514` | **Signal orange.** The only color. |
| `--sig-press` | `#E63D0F` | Pressed/active orange. |
| `--sig-soft` | `#FF6B3D` | Orange for thin marks on dark (slightly lifted). |
| `--sig-ink` | `#0A0A0A` | Ink on orange surfaces. Always black, never white. |
| `--shadow` / `--shadow-lg` | `none` / `none` | **Hairlines replace shadows.** Keep tokens defined as `0 0 0 0 transparent` so no selector breaks. |
| `--ok` | `#F4F3F0` | "Tip" semantics — white, not green. |
| `--err` | `#FF4514` | "Pitfall" semantics — orange is the alert color. |

### 2.2 Graph / category tokens (dark)

The pastel category palette dies. Categories become a **calibrated tonal ramp**
plus orange for the core — nodes are distinguished by tone + mono label + legend,
like grayscale layers on a schematic:

| Token | Dark value | Note |
|---|---|---|
| `--c-teal` | `#E8E6E1` | Tone 1 (lightest) |
| `--c-blue` | `#C9C5BD` | Tone 2 |
| `--c-violet` | `#A19C93` | Tone 3 |
| `--c-amber` | `#FF6B3D` | The one orange-family category tint |
| `--c-green` | `#DDD9D1` | Tone 1.5 |
| `--c-red` | `#FF4514` | Alert-mapped category |
| `--c-gold` | `#B8B3AA` | Tone 2.5 |
| `--c-gray` | `#57534E` | Muted / disabled |
| `--state` `#E8E6E1` · `--action` `#FF6B3D` · `--results` `#C9C5BD` · `--core` `#FF4514` | | Core node is the orange lamp of the whole graph. |

### 2.3 Where orange MAY appear

Confidence comes from scarcity. Orange is allowed on:

1. **Live/now indicators** — the brand dot, the eyebrow dot, the "you are here"
   marker in nav, the active TOC pill's underline or dot.
2. **Active states** — active graph tab, current stage rung + its progress bar,
   selected graph node stroke, wizard step dots that are `on`, `.on` intent chips.
3. **Data marks** — the graph core node, relation-connector draw lines, progress
   fills, ruler-tick bars, dot-matrix "lit" dots, the chevron on a hovered book.
4. **One hero surface per page** — a single full-orange panel moment (see §8:
   in light theme this is the poster panel; in dark it is at most a banner strip
   or the CTA band behind the wizard trigger, hazard-striped, ref 5).
5. **The alert semantic** — `--err`, pitfall labels, the "soon" state may NOT use
   it (soon is muted gray; orange means *live*, the opposite of soon).

### 2.4 Where orange may NOT appear

- **Never body or small text.** #FF4514 on #0A0A0A measures ≈4.5–5:1 — treat it
  as failing at body sizes: thin glyphs shimmer on black. Orange type is allowed
  only at display sizes (≥24px) or bold ≥18px mono labels, and even then sparingly.
- **Never as the default link color, never on paragraph emphasis.**
- **Never on white/off-white text on top of it** — on orange surfaces ink is
  always `--sig-ink` black (measures ≈5.7:1 — AA for normal text).
- **Never two orange moments competing in one viewport.** If the active tab and a
  banner are both visible, the banner wins and the tab drops to white-active.
- **Never tinted, transparent, or gradiented.** Orange is flat and total.

### 2.5 AA notes

- `--ink` #F4F3F0 on `--bg` #0A0A0A ≈ 17:1 — AAA.
- `--mut` #A8A49C on #0A0A0A ≈ 8:1 — AA at all sizes.
- `--mut-soft` #6E6A63 on #0A0A0A ≈ 3.6:1 — **large/label-only**; every
  `--mut-soft` usage must stay ≥12px bold mono or be decorative.
- Black on orange (`--sig-ink` on `--sig`) ≈ 5.7:1 — AA normal text. All copy on
  orange surfaces is black.
- Orange on black: reserve for large display, marks, surfaces, bold UI moments.
- Focus ring: `:focus-visible` outline switches from `var(--ink)` to
  **`var(--sig)`** — the highest-signal moment in the system deserves the lamp.
  (2px, offset 2, as today.)

---

## 3 · Typography

### 3.1 Families — single Google Fonts `<link>` swap across all 51 HTML files

Current line (identical in all 51 files):

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..700&display=swap
```

New line (sed across all 51 — verify with `grep -c 'Space+Grotesk' */*.html index.html`):

```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..700&display=swap
```

- **Space Grotesk** — display + UI voice (EN). The grotesk of refs 2/7.
- **JetBrains Mono** — the annotation layer: micro-labels, captions, numerals,
  HUD annotations, code-flavored nav. Tabular by design.
- **Newsreader stays** — demoted to ONE job: the light editorial serif drama
  moment (blockquotes, and optionally the hero's first line), exactly like the
  Phantom reference (#9). Weight 300, never bold. Keep the full axis string.
- **Vazirmatn stays** (jsdelivr link untouched) — all FA text, all FA digits.

Recommended CSS var aliases (define once in tokens):

```css
--f-disp:"Space Grotesk",-apple-system,system-ui,sans-serif;
--f-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
--f-serif:Newsreader,"Times New Roman",serif;
--f-fa:Vazirmatn,"Segoe UI",Tahoma,Arial,sans-serif;
```

### 3.2 Scale

| Role | EN face | Size | Weight | Track | Case | Notes |
|---|---|---|---|---|---|---|
| Display mega (hero h1) | Space Grotesk | clamp(40px,6.5vw,72px) | 500 | −0.03em | none | Line-height 1.02. Bigger than today — ref 1's "Jan 2025". |
| Display XL (h2 sections) | Space Grotesk | clamp(28px,3.6vw,44px) | 500 | −0.02em | none | Lives inside the black-bar header (§4.4). |
| Display MD (card titles h3/h4) | Space Grotesk | 22–24px | 500 | −0.01em | none | |
| Serif drama (blockquotes) | Newsreader | 24–28px | 300 | 0 | none | Italic allowed. The only serif on the site. |
| Body | Inter is gone → system? **No: Space Grotesk 400** | 16px | 400 | +0.01em | none | LH 1.55. Space Grotesk 400 is legible at body sizes and keeps one-family discipline. |
| Micro-label (kicker/eyebrow/badge) | JetBrains Mono | 11–12px | 700 | +0.14em | UPPERCASE | The signature layer. Prefixed by `//` or a 6px square/dot. |
| Caption / meta | JetBrains Mono | 12–13px | 400–500 | +0.04em | UPPERCASE | e.g. `NEW YORK, UNITED STATES` rows of ref 5. |
| Numerals (stats, counters) | JetBrains Mono | 28–40px | 500 | 0 | — | `font-variant-numeric:tabular-nums` stays everywhere. Slashed zero via `font-feature-settings:"zero"` where supported. |
| Pill CTA text | Space Grotesk | 15px | 500 | +0.01em | none | |
| Nav links | JetBrains Mono | 13px | 500 | +0.06em | UPPERCASE | `/ WHY` `/ HOW` `/ LIBRARY` — slash prefixes per ref 4. Slash is `--mut-soft`, label `--mut`, hover `--ink`. |

### 3.3 FA handling — how the mono layer degrades gracefully

Persian has no uppercase, joins its letters (letterspacing breaks the script),
and Vazirmatn is the mandated face. The annotation layer therefore translates,
not transliterates:

- **Scoping rule (already the codebase pattern):** all mono/tracking/uppercase
  declarations go under `html[data-lang="en"]` (or on `[data-only="en"]` spans).
  Base selectors keep `font-family:var(--f-fa); letter-spacing:0;
  text-transform:none;`.
- **FA micro-labels** = Vazirmatn **700 at 11–12px**, `letter-spacing:0`, same
  color tokens, same `//`-or-dot prefix glyph (the prefix is language-neutral
  punctuation and stays — in RTL it renders on the logical start via existing
  logical properties). Weight + size + hairline rule carry the "annotation"
  feeling that tracking carries in EN.
- **FA numerals**: `faDigits()` output (۰–۹) stays in Vazirmatn — do NOT force
  JetBrains Mono onto Persian digits (no Extended-Arabic coverage). Vazirmatn's
  digits are effectively tabular at these sizes; keep
  `font-variant-numeric:tabular-nums` (harmless no-op).
  Language-neutral numeral runs inside EN mode use mono.
- **Mixed runs** (Latin book titles inside FA text) already pass through `rlm()`
  isolates in book.js/index.html — those isolates may take
  `font-family:var(--f-mono)` only where they are annotations (`.borig`), never
  inside running FA prose.
- **Serif drama**: FA blockquotes stay Vazirmatn 300 (it ships light weights) —
  the drama in FA is the weight drop + size, not a serif.
- **RTL:** every new rule uses logical properties (`inset-inline-*`,
  `border-inline-*`, `margin-inline`) or an explicit `[dir="rtl"]` mirror, as the
  codebase already does (`.bchev`, `.rw-cgo`). Tick rulers and dot grids are
  symmetric and need no mirroring; the hazard-stripe angle flips with
  `[dir="rtl"]{--hz-angle:-45deg}`.

---

## 4 · Texture & Surface

Four textures, each with one job. All are CSS-only (gradients), all sit at
≤ 6% perceptual intensity, all are `pointer-events:none` decoration.

### 4.1 Dot-matrix (ref 2 — the LED specimen)

```css
background-image:radial-gradient(circle,var(--line-strong) 1px,transparent 1.5px);
background-size:12px 12px;
```

- **Where:** the hero band's background (replacing the pastel orbs — kill both
  `.hero::before/::after` radials); the empty state of the wizard; the `.mfake`
  media placeholder (a rising "bar chart" of lit dots: a second orange
  radial-gradient layer masked to the lower-left steps).
- "Lit" dots are the only orange in the texture and appear only in the hero's
  masked corner and `.mfake` — a few dozen dots, not a field.

### 4.2 Ruler ticks (ref 8 — the sleep bar)

```css
background-image:repeating-linear-gradient(90deg,var(--line-strong) 0 1px,transparent 1px 8px);
```

- **Where:** the stage ladder progress bars (`.rung .lbar` becomes a tick ruler
  with an orange fill `i` sliding over it); the wizard step dots row grows into a
  ticked progress rail; under the hero stat chips as a baseline rule; the graph
  hint pill's underline. In RTL the 90deg gradient is symmetric — no mirror needed;
  the *fill* direction follows logical start via `inset-inline-start`.

### 4.3 Hairline grid (ref 10 — the login panel)

```css
background-image:
  linear-gradient(var(--line-soft) 1px,transparent 1px),
  linear-gradient(90deg,var(--line-soft) 1px,transparent 1px);
background-size:56px 56px;
```

- **Where:** `.svgwrap` (the knowledge-graph canvas) — the graph floats on
  graph paper instead of pastel orbs (delete the orb `::before`); the library
  overlay sheet header; behind the masthead logo.

### 4.4 Black-bar section headers (ref 7 — District 9 docs)

Every `h2` section header becomes a **solid bar**: full-column black plate
(`--ink` on `--card` in dark reads weak — instead the bar is `--ink` background
with `--bg` text in light, and in dark an `--card2` plate with an orange index).

Spec (dark): a full-width-of-column strip, 48–56px tall, background `#161514`,
1px `--line` top+bottom, containing: mono index `01 //` in `--sig` + grotesk
title in `--ink` + a hairline that runs to the end of the bar. The existing
`h2 .num` spans become the mono index (EN gets mono; FA gets Vazirmatn-bold
Persian digits — same slot, `faDigits` already feeds it).

### 4.5 Hazard stripes (ref 5 — beta banner) — RATIONED

```css
background:repeating-linear-gradient(var(--hz-angle,45deg),var(--sig) 0 10px,#0A0A0A 10px 20px);
```

Used **once** in the whole product: as a 6px top border on the wizard's results
step ("your path is computed") or on a future changelog banner. Never on cards.

### 4.6 Surface rules

- **No shadows anywhere.** Elevation = hairline + surface step
  (`--bg → --card → --card2`). `--shadow*` tokens stay defined but transparent.
- Radii shrink from soft-editorial to instrument: cards 12px (was 16), the graph
  canvas 16px (was 24), sheets 16px, pills stay 9999px. Checkbox-like square
  marks (ref 1) are 4px.
- Backdrop blur survives only on the sticky navbar and the floating `.detail`
  card (it is functional there); `prefers-reduced-transparency` fallbacks stay.

---

## 5 · Components

All markup contracts (ids/classes rendered by `book.js`) are unchanged unless a
selector is updated in the same pass — these are restylings, not restructures.

**Masthead** (`.masthead`) — stays centered. Logomark square recolors: plate
`--card2`, network glyph strokes `--ink`, the center node `--sig` (the one lamp).
Logotype main line → Space Grotesk 500; `.lt-sub` → mono micro-label
(`50 BOOKS · 16 GROUPS`), FA per §3.3. Hairline-grid texture patch behind the
logo, 200px wide, fading out both sides.

**Navbar** (`.navbar/.toc/.navlinks`) — sticky black glass. Links become mono
slash-links (`/ WHY THIS EXISTS`); active TOC state = orange 6px square before
the label + `--ink` text (replaces today's filled ink pill — update `.toc a.active`
in book.css). `langbtn`/`themebtn` stay 40px outline pills, border
`--line-strong`. Brand dot → orange.

**Hero** (index + book pages, `.hero`) — pure canvas + dot-matrix corner. The
eyebrow pill becomes a **bare mono micro-label** (no pill background): orange dot
+ `ESSENTIAL BOOKS FOR PRODUCT BUILDERS`. H1 in Space Grotesk 500 at the mega
size. Dek stays `--mut`. Book pages' `.metastrip` becomes the HUD row: mono keys
(`AUTHOR //`, `PUBLISHED //`, `GROUP //`) over `--ink` values, separated by
hairlines — it already has this structure (`.mk/.mv`), only the type changes.

**Hero CTAs** (`.rw-trigger`) — exactly the ref-4 pair: primary = **filled
off-white pill, black text** (`--accent/--accent-ink`); secondary `.ghost` =
1px `--line-strong` outline pill. No orange CTA. Press scale stays.

**Stat chips** (`.chips .chip`) — become instrument tiles: `--card` plate, 12px
radius, mono numeral 32px `--ink` (`45`, `16`, `5`, `EN·FA`), mono 11px uppercase
label below in `--mut-soft`, and a 2px orange tick-mark at the tile's start edge.
Ruler-tick baseline under the row.

**Group cards** (`.group/.ghead/.gnum`) — `--card` with hairline. `.ghead`
becomes the black-bar header of the card: `--card2` plate, `.gnum` renders as
mono `03` (slashed zero) in `--sig`, group name Space Grotesk, blurb `--mut`.
Group index in FA = Persian digits, Vazirmatn bold.

**Book cards** (`.book/.btitle/.bchev/.badge`) — rows separated by hairlines
(as now). Title Space Grotesk 500; `.borig` (Latin original title under FA) is
already the perfect mono-caption slot → JetBrains Mono 12px uppercase. Author
line mono 12px `--mut-soft`. Chevron `.bchev`: default `--mut-soft`, on hover
slides 2px and turns **orange** (the "live" affordance; RTL mirror already
exists). `.badge.live` → mono micro-label with orange dot; `.badge.soon` → gray
outline mono label (never orange, §2.3).

**Graph canvas** (`.svgwrap/#netsvg/.legend/.ghint/.greset`) — graph paper
(§4.3) instead of orbs. Node fills per §2.2 tonal ramp; core node `--sig` with
black label; selected node stroke `--sig` 2px (replaces `--ink`); `.rel`
relation connectors draw in **orange** (`stroke:var(--sig)`, opacity .8) — the
draw animation already exists. `.ghint` → mono micro-label plate;
`.greset` → outline pill. Legend swatches become 8px squares, mono labels.
Keyboard/aria/drag/viewBox invariants untouched.

**Summary card** (`.detail`) — the HUD readout: black glass (`--card` 90% +
blur), 12px radius, `.dkick` mono orange-or-gray kicker with square swatch,
h4 Space Grotesk, `.dlab` mono labels (`TIP` in `--ok` white / `PITFALL` in
`--err` orange), `.dchip` cross-links = outline pills with tone squares.
`aria-live` behavior untouched.

**Stage ladder** (`.rung/.stagecard`) — rungs = instrument tiles; `.lv` mono
(`STAGE 1 // ELI5`); `.lbar` becomes the ruler-tick bar with orange fill;
active rung border → `--sig`. Stage card: `.badge` mono plate, h3 grotesk,
`.exbox` gets a 2px orange start-edge rule. `stagenav` buttons = outline pills.

**Wizard** (`assets/recommend.css`, all `.rw-*`) — the sheet is a black panel,
16px radius. Kicker mono; step dots → ticked rail, `on` segments orange
(`.rw-dot.on{background:var(--sig)}`). Level/time chips = instrument tiles with
square (not round) 16px ticks — checkbox square of ref 1, orange when `.on`,
black ✓ glyph. Intent pills `.on` → **orange fill + black text** (an allowed
bold-UI-moment, §2.3.2). Results: `.rw-rank` mono numerals in `--card2` squares,
`.rw-cmeta` mono caption, rank 1 may take the orange square. Bottom-sheet
behavior, 3 steps, `[data-recommend]` triggers untouched.

**Footer** (`.foot/.credit`) — hairline-top, mono caption voice:
`CREATED BY` micro-label + name in `--ink` grotesk, LinkedIn as outline pill or
underline-grow link (keep existing underline animation). Optionally a closing
mono line: `PRODUCT BUILDER'S LIBRARY // 50 BOOKS // EN·FA` (FA equivalent in
Vazirmatn, per §3.3).

**Library overlay** (`.liboverlay/.libsheet/.libgroup`) — black sheet, grid
texture in the header, group numbers mono orange, current book `a.cur` →
orange start-edge bar + `--card2` fill (replaces solid ink fill).

---

## 6 · Motion

Nothing new is invented; the existing system is re-aimed. Tokens stay exactly:
`--ease`, `--ease-out`, `--ease-io`, `--ease-drawer`, `--d1:.16s`, `--d2:.28s`,
`--d3:.5s`.

- **Keep:** press-scale on every pressable (`:active` .97/.98), hover gating
  behind `(hover:hover) and (pointer:fine)`, riseIn staggers (45ms steps),
  `animation-timeline:view()` progressive section settle, wizard `rwSlide`
  bottom-sheet, `cardIn` for `.detail`, `relDraw` for graph connectors.
- **Re-aim:** `relDraw` now draws **orange** lines — the highest-value motion on
  the site (a live circuit tracing). Selected-node scale stays.
- **Add (cheap, on-theme):**
  1. *Tick-fill* — stage `.lbar i` and wizard rail fills animate width with
     `--d2 var(--ease-out)`; the ruler underneath is static. Movement = data
     changing, per the HUD refs.
  2. *Lamp pulse* — the single "live" dot (masthead brand dot or eyebrow dot,
     one per page) gets a 2.4s opacity pulse `1 → .55 → 1`. Wrapped in
     `@media (prefers-reduced-motion:no-preference)`.
  3. *Chevron slide to orange* — already exists as translate; add the color
     transition (`color var(--d1)`).
- **Never:** parallax, glow, blur-in, typewriter effects, marquee. Instruments
  don't decorate their motion.
- `prefers-reduced-motion` block stays "gentle, not zero" exactly as written
  (opacity/color transitions survive, transforms drop, `relDraw` completes
  instantly). The lamp pulse dies entirely under reduced motion.

---

## 7 · Light theme — the poster inversion

Light is not "dark with white swapped in" — it is the **orange brutalist poster**
(refs 6/7): off-white paper, black ink, orange used *bigger* than in dark because
paper can afford it.

| Token | Light value | Note |
|---|---|---|
| `--bg` | `#F2F0EC` | Paper, slightly warm-gray (not the old #f5f5f5 warm cream). |
| `--bg2` | `#EAE8E3` | Alternating band. |
| `--card` | `#FAF9F7` | Card plate. |
| `--card2` | `#E4E1DB` | Inset plate. |
| `--ink` | `#111110` | Ink. |
| `--mut` | `#4A4843` | Body ≈ 8:1 on paper. |
| `--mut-soft` | `#7C786F` | Labels only. |
| `--line` / `--line-soft` / `--line-strong` | `#D8D5CE` / `#E5E2DC` / `#B9B5AC` | |
| `--accent` / `--accent-active` / `--accent-ink` | `#111110` / `#000000` / `#F2F0EC` | CTA pill inverts to ink (refs 6/7 pair black on orange/paper). |
| `--sig` / `--sig-press` / `--sig-ink` | `#F03E10` / `#D63407` / `#111110` | Slightly deepened orange for paper; ink on orange stays black. |
| `--ok` / `--err` | `#111110` / `#D63407` | |
| `--c-*` ramp | invert the tones: `#26241F / #57534E / #8A867D / #F03E10 / #3D3A35 / #D63407 / #6E6A63 / #C9C5BD` | Core `--core:#F03E10`. |

- **The orange surface moment lives here:** in light theme, ONE panel per page
  may go full international orange with black ink and black mono labels — the
  "How it works" band on index (`.lp-alt` → orange poster panel: black step
  numerals, black hairlines, black outline pills) and, on book pages, the
  `core_callout` (`.callout.accent`). Everything on it: `--sig-ink` black,
  hairlines `rgba(0,0,0,.35)`, buttons black-outline. AA: black on #F03E10 ≈ 5:1
  — normal text passes; keep sub-14px copy bold.
- Black-bar headers are literal in light: `--ink` bar, paper text — maximum
  poster contrast.
- Dot-matrix/tick/grid textures persist in light with `--line-strong` dots on
  paper (they read as print registration marks).
- Orange on paper (#F03E10 on #F2F0EC ≈ 3.9:1) — same rule as dark: display
  sizes, marks, surfaces only; never body text.

---

## 8 · What to KEEP from the current build

The redesign is a reskin of a healthy machine. Do not touch:

1. **The CMS architecture** — 50 thin-shell pages, inline `window.DATA`,
   `Book.mount()`, `assets/library.js` manifest, `tools/build-manifest.js`.
   No DATA edits; the only page-wide change is the fonts `<link>` sed (§3.1).
2. **The element contract** — every id (`app`, `netsvg`, `detailHost`,
   `ladderHost`, `libOverlay`, `langBtn`, `themeBtn`, …) and generated class
   (`node/ns/nlab/glink/rel/detail/toc/rung/chip/kbox/mcard`…) stays. Change
   generated markup only with same-pass selector updates in book.css.
3. **The a11y layer** — `:focus-visible` rings (now orange), `aria-live` summary
   card, graph keyboard operability (tabindex/role/aria), dialog semantics on
   overlays, `prefers-reduced-motion` (gentle-not-zero) and
   `prefers-reduced-transparency` blocks, `(hover:hover)(pointer:fine)` gating,
   `overflow-x:clip`.
4. **The stagger system** — riseIn cascades, nth-child delays, view-timeline
   progressive enhancement. Only easing targets recolor.
5. **Graph interactivity invariants** — fitted viewBox (no clipping),
   drawRelations connectors, drag clamped to viewBox, select/hover/dim states,
   tab pair (network/map), reset button.
6. **Bilingual machinery** — `pbl-theme`/`pbl-lang` localStorage keys, boot
   script, `[data-only]` spans, `faDigits/rlm/faText/TX`, Vazirmatn for FA,
   logical-property RTL discipline.
7. **The wizard flow** — 3 steps + results, scoring in `recommend.js`
   (`GROUP_TAGS`/`OVERRIDES`), bottom-sheet on mobile, `[data-recommend]`.
8. **Static-site constraints** — no build step, no JS libraries, fonts via
   `<link>` only, everything else offline-capable.

---

## 9 · Implementation order (suggested)

1. Token remap in the three token blocks (index inline, book.css) + `--sig`
   family + font var aliases. Site instantly goes dark-instrument.
2. Fonts `<link>` sed across 51 files + verify
   (`grep -c 'Space+Grotesk' index.html "NN"*/*.html` → 51).
3. Type layer: mono micro-label utility rules under `html[data-lang="en"]`
   scoping + FA weight fallbacks.
4. Textures: hero dot-matrix, graph paper on `.svgwrap`, tick bars, black-bar h2.
5. Component passes: index (hero/chips/groups/books) → book pages (metastrip,
   graph, ladder, detail) → wizard → overlay/footer.
6. Light-theme poster block + the orange panel moment.
7. QA: both themes × both languages × mobile; contrast spot-checks; reduced
   motion/transparency; `node --check` on touched JS (none expected).

*Author: art direction pass, July 2026.
