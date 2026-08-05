/* ============================================================================
   recommend.js — "Find my reading path" wizard
   ----------------------------------------------------------------------------
   A 2-step wizard (modal on desktop, bottom-sheet on mobile) that suggests the
   most-fit reading flow based on the reader's SENIORITY, FOCUS (intent) and TIME.

   Self-contained: brings its own bilingual (EN/FA) helpers and re-renders when
   the host page toggles data-lang. Depends only on window.LIBRARY (library.js).

   Public API:
     Recommend.open()   open the wizard
     Recommend.close()  close it
   Any element with [data-recommend] is auto-wired to open it on click.
   Optional link base for a nested page: <body data-book-base="../">.
   ========================================================================== */
(function () {
  'use strict';

  var DL = document.documentElement;
  function lang() { return DL.getAttribute('data-lang') || 'en'; }

  /* ── bilingual helpers (mirror book.js) ─────────────────────────────────── */
  var FA_D = '۰۱۲۳۴۵۶۷۸۹', RLM = '‏';
  function faDigits(s) { return String(s).replace(/[0-9]/g, function (d) { return FA_D[+d]; }); }
  function rlm(s) {
    return String(s)
      .replace(/[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ0-9'’.&:\/\-\*]*(?:\s+[A-Za-zÀ-ɏ0-9'’.&:\/\-\*]+)*/g,
        function (m) { return RLM + '⁦' + m + '⁩' + RLM; })
      .replace(/[0-9۰-۹]+/g, function (m) { return m + RLM; });
  }
  function faText(s) { return String(s).replace(/(<[^>]+>)|([^<]+)/g, function (m, tag, txt) { return tag ? tag : faDigits(rlm(txt)); }); }
  function TX(o) { if (o == null) return ''; if (typeof o === 'string') return o; return lang() === 'fa' ? faText(o.fa) : o.en; }
  function num(n) { return lang() === 'fa' ? faDigits(String(n)) : String(n); }

  /* ── taxonomy ───────────────────────────────────────────────────────────── */
  var LEVELS = [
    { key: 'junior',  en: 'Junior',  fa: 'تازه‌کار',  rank: 0 },
    { key: 'mid',     en: 'Mid',     fa: 'میانی',      rank: 1 },
    { key: 'senior',  en: 'Senior',  fa: 'ارشد',       rank: 2 },
    { key: 'manager', en: 'Manager', fa: 'مدیر',       rank: 3 }
  ];
  var LEVEL_HINT = {
    junior:  { en: 'Early in your craft — building the fundamentals.', fa: 'اوّلِ راه — در حالِ ساختنِ پایه‌ها.' },
    mid:     { en: 'Solid on the basics — going deeper and broader.',  fa: 'مسلط به پایه‌ها — در حالِ عمیق‌تر و گسترده‌تر شدن.' },
    senior:  { en: 'Experienced — sharpening judgment and strategy.',  fa: 'باتجربه — در حالِ تیزکردنِ قضاوت و استراتژی.' },
    manager: { en: 'Leading people — multiplying a team’s output.',    fa: 'رهبریِ آدم‌ها — چند برابر کردنِ خروجیِ تیم.' }
  };

  var INTENTS = [
    { key: 'communicate', en: 'Communicate & write', fa: 'ارتباط و نوشتن' },
    { key: 'lead',        en: 'Lead & manage',       fa: 'رهبری و مدیریت' },
    { key: 'build',       en: 'Build products',      fa: 'ساختِ محصول' },
    { key: 'strategy',    en: 'Strategy & decisions',fa: 'استراتژی و تصمیم' },
    { key: 'sell',        en: 'Sell & market',       fa: 'فروش و بازاریابی' },
    { key: 'startup',     en: 'Start a company',     fa: 'راه‌اندازیِ شرکت' },
    { key: 'career',      en: 'Grow my career',      fa: 'رشدِ شغلی' },
    { key: 'mindset',     en: 'Focus & mindset',     fa: 'تمرکز و ذهنیت' }
  ];

  var TIMES = [
    { key: 'quick',    n: 3, en: 'A quick start', fa: 'شروعِ سریع', sub: { en: '~3 books', fa: '~۳ کتاب' } },
    { key: 'balanced', n: 5, en: 'A solid stack', fa: 'دستهٔ متعادل', sub: { en: '~5 books', fa: '~۵ کتاب' } },
    { key: 'deep',     n: 8, en: 'A full path',   fa: 'مسیرِ کامل',  sub: { en: '~8 books', fa: '~۸ کتاب' } }
  ];

  /* group-level defaults (groupNum 1..15) */
  var GROUP_TAGS = {
    1:  { intents: ['communicate'],          snr: ['junior', 'mid'],                     len: 2 },
    2:  { intents: ['build', 'career'],       snr: ['mid', 'senior', 'manager'],          len: 2 },
    3:  { intents: ['strategy'],             snr: ['senior', 'manager'],                 len: 3 },
    4:  { intents: ['startup', 'mindset'],    snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    5:  { intents: ['lead'],                  snr: ['mid', 'senior', 'manager'],          len: 2 },
    6:  { intents: ['lead', 'strategy'],      snr: ['senior', 'manager'],                 len: 2 },
    7:  { intents: ['build'],                 snr: ['junior', 'mid'],                     len: 2 },
    8:  { intents: ['build', 'strategy'],     snr: ['mid', 'senior'],                     len: 2 },
    9:  { intents: ['sell'],                  snr: ['mid', 'senior', 'manager'],          len: 2 },
    10: { intents: ['build'],                 snr: ['junior', 'mid'],                     len: 1 },
    11: { intents: ['mindset'],               snr: ['junior', 'mid', 'senior'],           len: 1 },
    12: { intents: ['communicate', 'sell'],   snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    13: { intents: ['startup', 'strategy'],   snr: ['senior', 'manager'],                 len: 2 },
    14: { intents: ['career'],                snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    15: { intents: ['mindset'],               snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    16: { intents: ['mindset', 'lead', 'career'], snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    17: { intents: ['build', 'strategy'],     snr: ['junior', 'mid', 'senior', 'manager'], len: 2 },
    18: { intents: ['build', 'lead'],         snr: ['junior', 'mid', 'senior', 'manager'], len: 2 }
  };

  /* per-book overrides (only where the book differs from its group) */
  var OVERRIDES = {
    'the-making-of-a-manager':   { snr: ['junior', 'mid'], core: true },
    'high-output-management':    { snr: ['mid', 'senior', 'manager'], core: true },
    'inspired':                  { snr: ['junior', 'mid'], core: true },
    'empowered':                 { snr: ['senior', 'manager'] },
    'the-mom-test':              { len: 1, core: true },
    'dont-make-me-think':        { len: 1, core: true },
    'refactoring-ui':            { len: 1 },
    'purple-cow':                { len: 1 },
    'the-war-of-art':            { len: 1 },
    'subtle-art-of-not-giving-a-fck': { len: 1 },
    'good-strategy-bad-strategy':{ core: true },
    'the-effective-executive':   { snr: ['junior', 'mid', 'senior', 'manager'], core: true },
    'radical-candor':            { core: true },
    'never-split-the-difference':{ core: true },
    'influence':                 { len: 3, core: true },
    'shoe-dog':                  { len: 3 },
    'crossing-the-chasm':        { core: true },
    'the-lean-startup':          { core: true },
    /* 16 — Self Mastery */
    'start-with-why':            { intents: ['lead', 'strategy', 'communicate'], core: true, len: 1 },
    'the-art-of-seduction':      { intents: ['sell', 'communicate'], snr: ['mid', 'senior', 'manager'], len: 3 },
    'surrounded-by-psychopaths': { intents: ['lead', 'communicate'], snr: ['mid', 'senior', 'manager'], len: 2 },
    'the-way-forward':           { intents: ['mindset', 'career'], len: 1 },
    'the-power-of-now':          { intents: ['mindset'], core: true, len: 2 },
    /* 17 — Working with AI */
    'co-intelligence':           { intents: ['build', 'mindset', 'career'], core: true, len: 1 },
    'the-ai-product-managers-handbook': { intents: ['build'], snr: ['junior', 'mid', 'senior'], core: true, len: 2 },
    'human-plus-machine':        { intents: ['strategy', 'lead'], snr: ['mid', 'senior', 'manager'], len: 2 },
    'prediction-machines':       { intents: ['strategy'], snr: ['senior', 'manager'], len: 3 },
    /* 18 — Delivery & Projects */
    'project-management-unofficial':     { intents: ['lead', 'career'], snr: ['junior', 'mid'], core: true, len: 1 },
    'scrum-twice-the-work-half-the-time': { intents: ['build', 'lead'], snr: ['junior', 'mid'], len: 1 },
    'the-phoenix-project':       { intents: ['build', 'lead'], snr: ['mid', 'senior', 'manager'], core: true, len: 3 },
    'the-mythical-man-month':    { intents: ['build', 'lead'], snr: ['mid', 'senior', 'manager'], core: true, len: 2 },
    'project-management-beginners-guide': { intents: ['build', 'career'], snr: ['junior'], len: 2 }
  };

  function tagsFor(entry) {
    var g = GROUP_TAGS[entry.groupNum] || { intents: [], snr: ['junior', 'mid', 'senior', 'manager'], len: 2 };
    var o = OVERRIDES[entry.slug] || {};
    return {
      intents: o.intents || g.intents,
      snr: o.snr || g.snr,
      len: o.len != null ? o.len : g.len,
      core: !!o.core
    };
  }

  /* ── scoring ────────────────────────────────────────────────────────────── */
  function rankOf(k) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].key === k) return LEVELS[i].rank; return 1; }

  function scoreEntry(entry, sel) {
    var t = tagsFor(entry);
    var s = 0, matchedIntent = null;

    /* intent match — the strongest signal */
    if (sel.intents.length) {
      var hits = 0;
      sel.intents.forEach(function (k) { if (t.intents.indexOf(k) !== -1) { hits++; if (!matchedIntent) matchedIntent = k; } });
      if (hits === 0) return null;              // no focus overlap → drop it
      s += hits * 3;
    }

    /* seniority fit — exact = 2, adjacent = 1 */
    if (sel.level) {
      if (t.snr.indexOf(sel.level) !== -1) { s += 2; }
      else {
        var want = rankOf(sel.level), near = false;
        t.snr.forEach(function (k) { if (Math.abs(rankOf(k) - want) === 1) near = true; });
        s += near ? 1 : 0;
      }
    }

    if (t.core) s += 1.5;                         // foundational nudge
    if (sel.time === 'quick') s += (3 - t.len) * 0.5;  // prefer shorter when time is tight

    return { entry: entry, tags: t, score: s, matchedIntent: matchedIntent };
  }

  function recommend(sel) {
    var lib = window.LIBRARY || [];
    var scored = [];
    lib.forEach(function (e) { var r = scoreEntry(e, sel); if (r) scored.push(r); });

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.tags.len !== b.tags.len) return a.tags.len - b.tags.len;   // shorter first
      return a.entry.groupNum - b.entry.groupNum;
    });

    var want = (TIMES.filter(function (x) { return x.key === sel.time; })[0] || TIMES[1]).n;
    var top = scored.slice(0, want);

    /* order the final set as a progression: approachable → advanced */
    top.sort(function (a, b) {
      var la = Math.min.apply(null, a.tags.snr.map(rankOf));
      var lb = Math.min.apply(null, b.tags.snr.map(rankOf));
      if (la !== lb) return la - lb;
      return b.score - a.score;
    });
    return top;
  }

  /* ── fit reason (bilingual) ─────────────────────────────────────────────── */
  function intentLabel(k) { var x = INTENTS.filter(function (i) { return i.key === k; })[0]; return x || { en: k, fa: k }; }
  function levelLabel(k) { var x = LEVELS.filter(function (i) { return i.key === k; })[0]; return x || { en: k, fa: k }; }

  function reasonFor(r, sel) {
    var it = r.matchedIntent || (r.tags.intents[0]);
    var il = intentLabel(it), ll = sel.level ? levelLabel(sel.level) : null;
    if (r.tags.core && !sel.intents.length) return { en: 'A foundational read for ' + (ll ? ll.en.toLowerCase() + 's' : 'anyone') + '.', fa: 'یک خواندنِ پایه‌ای' + (ll ? ' برای ' + ll.fa : '') + '.' };
    var en = 'Helps you ' + il.en.toLowerCase() + (ll ? ' at ' + ll.en.toLowerCase() + ' level' : '') + '.';
    var fa = 'برای ' + il.fa + (ll ? ' در سطحِ ' + ll.fa : '') + '.';
    return { en: en, fa: fa };
  }

  /* ── icons ──────────────────────────────────────────────────────────────── */
  var IC = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    fwd:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9 17.5 20 6.5"/></svg>'
  };

  /* ── state + DOM ────────────────────────────────────────────────────────── */
  var state = { open: false, step: 1, level: null, intents: [], time: 'balanced' };
  var root = null, lastFocus = null, closeTimer = null;

  function base() { return (document.body && document.body.getAttribute('data-book-base')) || ''; }
  function hrefFor(entry) { return base() + encodeURI(entry.folder + '/' + entry.slug + '.html'); }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'rw-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Find my reading path');
    root.innerHTML = '<div class="rw-sheet" role="document" tabindex="-1"><div class="rw-body" id="rwBody"></div></div>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (state.open && e.key === 'Escape') close(); });
    return root;
  }

  /* ── navigation direction — drives the step-transition motion ───────────── */
  /* "fwd"/"back" slide the step content along the direction of travel;
     "none" (chip picks, language flips) re-renders without replaying motion. */
  function setDir(d) {
    var sh = root && root.querySelector('.rw-sheet');
    if (sh) sh.setAttribute('data-dir', d);
  }
  function nav(step) {
    var moved = step !== state.step;
    setDir(moved ? (step > state.step ? 'fwd' : 'back') : 'none');
    state.step = step; render();
    /* render() replaced the DOM, destroying whatever held focus — on a real
       step change, park focus on the sheet (mirrors open()) so keyboard/SR
       users stay inside the dialog instead of dropping to body, and start
       the new step from its top (spatial consistency with the slide) */
    if (moved && root) {
      var sh = root.querySelector('.rw-sheet');
      if (sh) {
        sh.scrollTop = 0;
        try { sh.focus({ preventScroll: true }); } catch (e) { sh.focus(); }
      }
    }
  }
  function rerender() { setDir('none'); render(); }

  function chip(active, label, sub) {
    /* toggle semantics: the "on" state must reach assistive tech, not just CSS */
    return '<button type="button" class="rw-chip' + (active ? ' on' : '')
      + '" aria-pressed="' + (active ? 'true' : 'false') + '">'
      + '<span class="rw-cktick">' + IC.check + '</span>'
      + '<span class="rw-cklab">' + label + '</span>'
      + (sub ? '<span class="rw-cksub">' + sub + '</span>' : '')
      + '</button>';
  }

  function render() {
    ensureRoot();
    var body = root.querySelector('#rwBody');
    var L = lang();
    var closeBtn = '<button class="rw-x" id="rwClose" aria-label="Close">' + IC.close + '</button>';

    if (state.step === 4) { body.innerHTML = closeBtn + renderResults(); wireResults(); return; }

    var steps = 3;
    var dots = '';
    for (var i = 1; i <= steps; i++) dots += '<span class="rw-dot' + (i <= state.step ? ' on' : '') + '"></span>';
    /* the rail is visual; announce "Step N of 3" to assistive tech instead */
    var railLab = L === 'fa'
      ? 'مرحلهٔ ' + faDigits(state.step) + ' از ' + faDigits(steps)
      : 'Step ' + state.step + ' of ' + steps;

    var head = '<div class="rw-head">'
      + '<div class="rw-kicker"><span class="rw-spark">' + IC.spark + '</span>'
        + '<span data-only="en">Find my reading path</span><span data-only="fa">مسیرِ خواندنم را پیدا کن</span></div>'
      + '<div class="rw-steps" role="img" aria-label="' + railLab + '">' + dots + '</div>'
      + '</div>';

    var content, foot;

    if (state.step === 1) {
      var lvls = LEVELS.map(function (lv) {
        return chip(state.level === lv.key, TX(lv), TX(LEVEL_HINT[lv.key]));
      }).join('');
      content = '<div class="rw-q">'
        + '<h3><span data-only="en">Where are you right now?</span><span data-only="fa">همین حالا کجای مسیری؟</span></h3>'
        + '<p><span data-only="en">Pick the level that fits you best.</span><span data-only="fa">سطحی را که بیشتر به تو می‌خورد انتخاب کن.</span></p>'
        + '<div class="rw-chips rw-lvls" data-group="level">' + lvls + '</div></div>';
      foot = '<div class="rw-foot">'
        + '<button type="button" class="rw-skip" id="rwSkip"><span data-only="en">Skip</span><span data-only="fa">رد کن</span></button>'
        + '<button class="rw-next" id="rwNext"' + (state.level ? '' : ' disabled') + '>'
          + '<span data-only="en">Next</span><span data-only="fa">بعدی</span>'
          + '<span class="rw-fwd">' + IC.fwd + '</span></button></div>';
    } else if (state.step === 2) {
      var its = INTENTS.map(function (it) { return chip(state.intents.indexOf(it.key) !== -1, TX(it)); }).join('');
      content = '<div class="rw-q">'
        + '<h3><span data-only="en">What do you want to get better at?</span><span data-only="fa">می‌خواهی در چه چیزی بهتر شوی؟</span></h3>'
        + '<p><span data-only="en">Choose one or more — or none to see the essentials.</span><span data-only="fa">یکی یا چندتا انتخاب کن — یا هیچ‌کدام، تا کتاب‌های ضروری را ببینی.</span></p>'
        + '<div class="rw-chips" data-group="intent">' + its + '</div></div>';
      foot = '<div class="rw-foot">'
        + '<button class="rw-ghost" id="rwBack"><span class="rw-bk">' + IC.back + '</span>'
          + '<span data-only="en">Back</span><span data-only="fa">قبلی</span></button>'
        + '<button class="rw-next" id="rwNext2">'
          + '<span data-only="en">Next</span><span data-only="fa">بعدی</span>'
          + '<span class="rw-fwd">' + IC.fwd + '</span></button></div>';
    } else {
      var tms = TIMES.map(function (t) { return chip(state.time === t.key, TX(t), TX(t.sub)); }).join('');
      content = '<div class="rw-q">'
        + '<h3><span data-only="en">How much time do you have?</span><span data-only="fa">چقدر وقت داری؟</span></h3>'
        + '<p><span data-only="en">This sets how many books your path contains.</span><span data-only="fa">این تعیین می‌کند مسیرت چند کتاب داشته باشد.</span></p>'
        + '<div class="rw-chips rw-times" data-group="time">' + tms + '</div></div>';
      foot = '<div class="rw-foot">'
        + '<button class="rw-ghost" id="rwBack2"><span class="rw-bk">' + IC.back + '</span>'
          + '<span data-only="en">Back</span><span data-only="fa">قبلی</span></button>'
        + '<button class="rw-next" id="rwGo">'
          + '<span data-only="en">Build my reading flow</span><span data-only="fa">مسیرِ خواندنم را بساز</span>'
          + '<span class="rw-fwd">' + IC.fwd + '</span></button></div>';
    }

    body.innerHTML = closeBtn + head + content + foot;
    wireStep();
  }

  function wireStep() {
    root.querySelector('#rwClose').onclick = close;
    var chipsWrap = root.querySelectorAll('.rw-chips');
    chipsWrap.forEach(function (wrap) {
      var group = wrap.getAttribute('data-group');
      var btns = wrap.querySelectorAll('.rw-chip');
      btns.forEach(function (b, i) {
        b.onclick = function () {
          if (group === 'level') { state.level = LEVELS[i].key; rerender(); }
          else if (group === 'time') { state.time = TIMES[i].key; rerender(); }
          else if (group === 'intent') {
            var k = INTENTS[i].key, at = state.intents.indexOf(k);
            if (at === -1) state.intents.push(k); else state.intents.splice(at, 1);
            rerender();
          }
          /* the re-render destroyed this button — hand focus to its
             replacement so keyboard users keep their place in the group */
          var again = root.querySelectorAll('.rw-chips[data-group="' + group + '"] .rw-chip')[i];
          if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} }
        };
      });
    });
    function goTo(step) { nav(step); }
    var nx = root.querySelector('#rwNext');  if (nx) nx.onclick  = function () { if (state.level) goTo(2); };
    var sk = root.querySelector('#rwSkip');  if (sk) sk.onclick  = function () { goTo(2); };
    var bk = root.querySelector('#rwBack');  if (bk) bk.onclick  = function () { goTo(1); };
    var n2 = root.querySelector('#rwNext2'); if (n2) n2.onclick  = function () { goTo(3); };
    var b2 = root.querySelector('#rwBack2'); if (b2) b2.onclick  = function () { goTo(2); };
    var go = root.querySelector('#rwGo');    if (go) go.onclick  = function () { goTo(4); };
  }

  function renderResults() {
    var list = recommend(state);
    var sel = state;
    var cards = list.map(function (r, i) {
      var e = r.entry, reason = reasonFor(r, sel);
      return '<a class="rw-card" href="' + hrefFor(e) + '">'
        + '<span class="rw-rank">' + num(i + 1) + '</span>'
        + '<span class="rw-cbody">'
          + '<span class="rw-ctitle">' + TX(e.book) + '</span>'
          + '<span class="rw-cmeta">' + num(e.groupNum) + ' · ' + TX(e.group) + '</span>'
          + '<span class="rw-creason">' + TX(reason) + '</span>'
        + '</span>'
        + '<span class="rw-cgo">' + IC.fwd + '</span></a>';
    }).join('');

    var summaryEn = 'For a ' + (sel.level ? levelLabel(sel.level).en.toLowerCase() : 'curious reader')
      + (sel.intents.length ? ' focused on ' + sel.intents.map(function (k) { return intentLabel(k).en.toLowerCase(); }).join(', ') : '') + '.';
    var summaryFa = 'برای ' + (sel.level ? levelLabel(sel.level).fa : 'یک خوانندهٔ کنجکاو')
      + (sel.intents.length ? ' با تمرکز بر ' + sel.intents.map(function (k) { return intentLabel(k).fa; }).join('، ') : '') + '.';

    var first = list[0];
    return '<div class="rw-res">'
      + '<div class="rw-head rw-rhead">'
        + '<div><div class="rw-kicker"><span class="rw-spark">' + IC.spark + '</span>'
          + '<span data-only="en">Your reading flow</span><span data-only="fa">مسیرِ خواندنِ تو</span></div>'
          + '<p class="rw-rsub">' + TX({ en: summaryEn, fa: summaryFa }) + '</p></div>'
      + '</div>'
      + '<div class="rw-cards">' + (cards || emptyMsg()) + '</div>'
      + '<div class="rw-foot rw-rfoot">'
        /* answers are kept when going back — say so ("Adjust", not "Start over") */
        + '<button class="rw-ghost" id="rwRestart"><span data-only="en">Adjust answers</span><span data-only="fa">تغییرِ پاسخ‌ها</span></button>'
        + (first ? '<a class="rw-next" id="rwStart" href="' + hrefFor(first.entry) + '">'
            + '<span data-only="en">Start reading</span><span data-only="fa">شروعِ خواندن</span>'
            + '<span class="rw-fwd">' + IC.fwd + '</span></a>' : '')
      + '</div></div>';
  }
  function emptyMsg() {
    return '<div class="rw-empty"><span data-only="en">No exact match — try fewer focus areas.</span>'
      + '<span data-only="fa">تطابقِ دقیقی نبود — تمرکزهای کمتری را امتحان کن.</span></div>';
  }
  function wireResults() {
    root.querySelector('#rwClose').onclick = close;
    var rs = root.querySelector('#rwRestart');
    if (rs) rs.onclick = function () { nav(1); };
  }

  /* ── open / close ───────────────────────────────────────────────────────── */
  function open(trigger) {
    ensureRoot();
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    root.classList.remove('closing');
    /* return focus here on close — Safari/Firefox don't focus buttons on click,
       so fall back to the trigger instead of document.body (mirrors book.js) */
    var ae = document.activeElement;
    lastFocus = (ae && ae !== document.body && ae !== document.documentElement) ? ae
      : (trigger && trigger.focus ? trigger : null);
    state.open = true; state.step = 1;
    setDir('fwd');                 /* first step slides in with the sheet */
    render();
    root.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    var sh = root.querySelector('.rw-sheet');
    if (sh) { try { sh.focus({ preventScroll: true }); } catch (e) { sh.focus(); } }
  }
  function close() {
    if (!root || !state.open) return;
    state.open = false;
    var finish = function () {
      closeTimer = null;
      root.classList.remove('open');
      root.classList.remove('closing');
      document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
      lastFocus = null;
    };
    /* exit travels the entrance path back out, faster (.18s) — skipped
       entirely under prefers-reduced-motion */
    var reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce) { finish(); return; }
    root.classList.add('closing');
    closeTimer = setTimeout(finish, 190);
  }

  /* re-render live when the host page flips language/theme while open */
  try {
    new MutationObserver(function () { if (state.open) rerender(); })
      .observe(DL, { attributes: true, attributeFilter: ['data-lang'] });
  } catch (e) {}

  /* auto-wire triggers */
  function wireTriggers() {
    [].slice.call(document.querySelectorAll('[data-recommend]')).forEach(function (el) {
      if (el.__rwWired) return; el.__rwWired = true;
      el.addEventListener('click', function (ev) { ev.preventDefault(); open(el); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireTriggers);
  else wireTriggers();

  window.Recommend = { open: open, close: close, wire: wireTriggers };
})();
