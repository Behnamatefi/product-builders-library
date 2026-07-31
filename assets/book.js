/* ============================================================================
   book.js — shared runtime for The Product Builder's Library
   ----------------------------------------------------------------------------
   One file drives all 50 book pages. Each page ships only its DATA object
   (content) + a thin shell; this script renders the hero, sticky nav, the
   library navigation header, the interactive knowledge graph, the 5-stage
   ladder, quotes, media, and footer — all from DATA.

   Entry point:  Book.mount(DATA)   (called by every book page)
   Depends on:   window.LIBRARY     (assets/library.js — the 50-book manifest)
   ========================================================================== */
(function () {
  'use strict';

  /* ── shared, language-fixed UI strings (identical on every book) ───────── */
  var UI = {
    dekFallback: { en: '', fa: '' },
    sections: {
      tldr:   { en: 'In a nutshell',        fa: 'خلاصه' },
      graph:  { en: 'Knowledge graph',      fa: 'نقشهٔ دانش' },
      stages: { en: '5 stages',             fa: '۵ مرحله' },
      quotes: { en: 'Quotes',               fa: 'جمله‌ها' },
      media:  { en: 'Watch & explore',      fa: 'تماشا و منابع' },
      apply:  { en: 'Apply it',             fa: 'کاربرد' }
    }
  };

  /* ── language + number formatting ──────────────────────────────────────── */
  var LANG = document.documentElement.getAttribute('data-lang') || 'en';
  var FA_D = '۰۱۲۳۴۵۶۷۸۹';
  var RLM  = '‏';
  function faDigits(s) { return String(s).replace(/[0-9]/g, function (d) { return FA_D[+d]; }); }
  function rlm(s) {
    return String(s)
      .replace(/[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ0-9'’.&:\/\-]*(?:\s+[A-Za-zÀ-ɏ0-9'’.&:\/\-]+)*/g,
        function (m) { return RLM + '⁦' + m + '⁩' + RLM; })
      .replace(/[0-9۰-۹]+/g, function (m) { return m + RLM; });
  }
  function faText(s) { return String(s).replace(/(<[^>]+>)|([^<]+)/g, function (m, tag, txt) { return tag ? tag : faDigits(rlm(txt)); }); }
  function TX(o) { if (o == null) return ''; if (typeof o === 'string') return o; return LANG === 'fa' ? faText(o.fa) : o.en; }
  function num(n) { return LANG === 'fa' ? faDigits(n) : String(n); }
  /* raw bilingual pair as data-only spans (static hero text — NOT run through faText) */
  function L(o) { return '<span data-only="en">' + (o && o.en != null ? o.en : '') + '</span><span data-only="fa">' + (o && o.fa != null ? o.fa : '') + '</span>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  var DATA = null;

  /* ── icons ─────────────────────────────────────────────────────────────── */
  var IC = {
    home:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    prev:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    next:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    grid:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    globe: '<svg class="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    sun:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
    moon:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>',
    play:  '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    li:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z"/></svg>',
    logo:  '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="7" fill="var(--card2)" stroke="var(--line-strong)"/><g stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" opacity=".9"><path d="M16 16 8.5 9.5M16 16l8-4M16 16l-3 8.5"/></g><g fill="var(--ink)"><circle cx="8.5" cy="9.5" r="2.1"/><circle cx="24" cy="12" r="2.1"/><circle cx="13" cy="24.5" r="2.1"/></g><circle cx="16" cy="16" r="3.1" fill="var(--ink)"/></svg>'
  };
  var MASTHEAD =
    '<header class="masthead"><a class="logo" href="../index.html" aria-label="Product Builder\'s Library — home">'
    + '<span class="logomark">' + IC.logo + '</span>'
    + '<span class="logotype">'
      + '<span class="lt-main"><span data-only="en">Product Builder’s Library</span><span data-only="fa">کتابخانهٔ سازندهٔ محصول</span></span>'
      + '<span class="lt-sub"><span data-only="en">50 books · 16 groups</span><span data-only="fa">۵۰ کتاب · ۱۶ گروه</span></span>'
    + '</span></a></header>';

  /* ── SHELL — build hero + nav + section skeleton from DATA.meta ─────────── */
  function kbox(k) {
    return '<div class="kbox"><div class="v" data-only="en">' + esc0(k.v.en) + '</div><div class="v" data-only="fa">' + esc0(k.v.fa) + '</div>'
      + '<div class="l" data-only="en">' + esc0(k.l.en) + '</div><div class="l" data-only="fa">' + esc0(k.l.fa) + '</div></div>';
  }
  /* meta strings may contain intentional inline markup (<i>, <b>) — pass through as-is */
  function esc0(s) { return s == null ? '' : String(s); }

  /* hero HUD corner readout — real coordinates from the manifest:
     "GROUP 03/16 // BOOK 07/50" (FA: Persian digits, «از» instead of the slash) */
  function heroHud(m) {
    var lib = window.LIBRARY || [];
    var idx = -1, groups = 0;
    for (var i = 0; i < lib.length; i++) {
      if (lib[i].slug === m.slug) idx = i;
      if (lib[i].groupNum > groups) groups = lib[i].groupNum;
    }
    if (idx < 0 || !lib.length) return '';
    var g = ('0' + lib[idx].groupNum).slice(-2), b = ('0' + (idx + 1)).slice(-2);
    return '<div class="hud" aria-hidden="true">'
      + '<span data-only="en">Group ' + g + '/' + groups + ' // Book ' + b + '/' + lib.length + '</span>'
      + '<span data-only="fa">گروه ' + faDigits(g) + ' از ' + faDigits(groups) + ' // کتاب ' + faDigits(b) + ' از ' + faDigits(lib.length) + '</span>'
      + '</div>';
  }

  function renderShell(m) {
    var kboxes = (m.kboxes || []).map(kbox).join('');
    var dek = m.dek || UI.dekFallback;

    var html =
    /* ── MASTHEAD (centered logo → home) ── */
    MASTHEAD
    /* ── HERO ── */
    + '<header class="hero"><div class="wrap">'
      + heroHud(m)
      + '<div class="eyebrow"><span class="edot"></span>'
        + '<span data-only="en">Book knowledge map · ' + esc0((m.eyebrow_author || m.author).en) + '</span>'
        + '<span data-only="fa">نقشهٔ کتاب · ' + esc0((m.eyebrow_author || m.author).fa) + '</span></div>'
      + '<h1>' + L(m.hero_title) + '</h1>'
      + '<p class="dek">' + L(dek) + '</p>'
      + '<div class="metastrip">'
        + metaItem({ en: 'Book', fa: 'کتاب' }, m.book)
        + metaItem({ en: 'Author', fa: 'نویسنده' }, m.author)
        + metaItem({ en: 'Published', fa: 'سالِ چاپ' }, m.published)
        + metaItem({ en: 'Group', fa: 'گروه' }, m.group)
      + '</div>'
    + '</div></header>'

    /* ── STICKY NAV (+ library header) ── */
    + '<div class="navbar"><div class="navin">'
      + '<div class="libnav">'
        + '<a class="libbtn icon" id="navHome" href="../index.html" title="Library / کتابخانه" aria-label="Library">' + IC.home + '</a>'
        + '<a class="libbtn icon hide-sm" id="navPrev" aria-label="Previous book">' + IC.prev + '</a>'
        + '<a class="libbtn icon hide-sm" id="navNext" aria-label="Next book">' + IC.next + '</a>'
        + '<button class="libbtn" id="navAll" aria-haspopup="dialog">' + IC.grid
          + '<span class="lbl" data-only="en">All books</span><span class="lbl" data-only="fa">همهٔ کتاب‌ها</span></button>'
      + '</div>'
      + '<span class="brand"><span class="dot"></span>' + esc0(m.book.en) + '</span>'
      + '<nav class="toc">'
        + tocLink('tldr', UI.sections.tldr)
        + tocLink('graph', UI.sections.graph)
        + tocLink('stages', UI.sections.stages)
        + tocLink('quotes', UI.sections.quotes)
        + tocLink('media', { en: 'Watch &amp; explore', fa: 'تماشا و منابع' })
        + tocLink('apply', UI.sections.apply)
      + '</nav>'
      + '<div class="navctl">'
        + '<button class="langbtn" id="langBtn" aria-label="Switch language">' + IC.globe
          + '<span data-only="en">فارسی</span><span data-only="fa">English</span></button>'
        + '<button class="themebtn" id="themeBtn" aria-label="Toggle theme" title="Light / Dark">'
          + '<span class="ic-sun" aria-hidden="true">' + IC.sun + '</span>'
          + '<span class="ic-moon" aria-hidden="true">' + IC.moon + '</span></button>'
      + '</div>'
    + '</div></div>'

    /* ── all-books overlay ── */
    + '<div class="liboverlay" id="libOverlay" role="dialog" aria-modal="true" aria-label="All books"><div class="libsheet">'
      + '<div class="lhead"><div>'
        + '<h3><span data-only="en">The Product Builder’s Library</span><span data-only="fa">کتابخانهٔ سازندهٔ محصول</span></h3>'
        + '<p><span data-only="en">50 books · 16 skill groups — jump to any page</span><span data-only="fa">۵۰ کتاب · ۱۶ گروهِ مهارت — به هر صفحه برو</span></p>'
      + '</div><button class="libclose" id="libClose" aria-label="Close">' + IC.close + '</button></div>'
      + '<div class="libgrid" id="libGrid"></div>'
    + '</div></div>'

    /* ── CONTENT ── */
    + '<div class="wrap">'
      + h2('tldr', 1, { en: ' In a nutshell', fa: ' خلاصه' })
      + '<p class="sub" data-only="en">If you read only this, you still get the whole idea.</p>'
      + '<p class="sub" data-only="fa">اگر فقط همین بخش را بخوانی، کلِ ایده دستت می‌آید.</p>'
      + '<div class="card lead"><ul class="clean" id="tldrHost"></ul></div>'
      + '<div class="kgrid">' + kboxes + '</div>'
      + '<div class="callout accent">' + L(m.core_callout.label)
        + '<span data-only="en"> ' + esc0(m.core_callout.en) + '</span>'
        + '<span data-only="fa"> ' + esc0(m.core_callout.fa) + '</span></div>'

      + h2('graph', 2, { en: ' The knowledge graph', fa: ' نقشهٔ دانش' })
      + '<p class="sub" data-only="en">The whole book as one picture. Click any node to focus its connections and read more — or switch to the structured map.</p>'
      + '<p class="sub" data-only="fa">کلِ کتاب در یک تصویر. روی هر دایره کلیک کن تا ارتباط‌هایش را ببینی و بیشتر بخوانی — یا به نقشهٔ مرتب برو.</p>'
      + '<div class="gtabs">'
        + '<button class="gtab active" id="tabNet" aria-pressed="true"><span data-only="en">Interactive network</span><span data-only="fa">شبکهٔ تعاملی</span></button>'
        + '<button class="gtab" id="tabMap" aria-pressed="false"><span data-only="en">Structured map</span><span data-only="fa">نقشهٔ مرتب</span></button>'
      + '</div>'
      + '<div class="graphfull" id="netView"><div class="legend" id="legendHost"></div>'
        + '<div class="svgwrap">'
          + '<svg id="netsvg" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid meet" role="img" aria-label="knowledge network"></svg>'
          + '<div class="ghint" id="ghint"></div><button class="greset" id="greset"></button>'
          + '<aside class="detail" id="detailHost" aria-live="polite"></aside>'
        + '</div></div>'
      + '<div class="card" id="mapView" style="display:none">'
        + '<div class="flowline" id="flowTop"></div><div class="mapgrid" id="mapHost"></div>'
        + '<div class="callout" style="margin-top:16px">' + L(m.flow_callout.label)
          + '<span data-only="en"> ' + esc0(m.flow_callout.en) + '</span>'
          + '<span data-only="fa"> ' + esc0(m.flow_callout.fa) + '</span></div></div>'

      + h2('stages', 3, { en: ' Learn it in 5 stages', fa: ' یادگیری در ۵ مرحله' })
      + '<p class="sub" data-only="en">The same book at five depths. Start over-simplified, climb to expert. Tap a rung to jump.</p>'
      + '<p class="sub" data-only="fa">یک کتاب در پنج عمق. از خیلی ساده شروع کن و تا حرفه‌ای بالا برو. روی هر پله بزن تا بپری.</p>'
      + '<div class="ladder" id="ladderHost"></div><div id="stageHost"></div>'

      + h2('quotes', 4, { en: ' Lines worth keeping', fa: ' جمله‌هایی که ارزشِ نگه‌داشتن دارند' })
      + '<p class="sub" data-only="en">Verbatim quotes from the book, translated alongside.</p>'
      + '<p class="sub" data-only="fa">جمله‌های مستقیم از کتاب، همراه با ترجمه.</p>'
      + '<div class="qgrid" id="quoteHost"></div>'

      + h2('media', 5, { en: ' Watch &amp; explore', fa: ' تماشا و منابع' })
      + '<p class="sub" data-only="en">Special resources found online — each with what it covers and who it’s best for.</p>'
      + '<p class="sub" data-only="fa">منابعِ ویژه‌ای که آنلاین پیدا شد — هرکدام با اینکه چه می‌گوید و به چه دردی می‌خورد.</p>'
      + '<div class="mgrid" id="mediaHost"></div>'
      + '<div class="card" style="margin-top:16px"><div style="font-weight:800;font-size:13.5px;margin-bottom:4px">'
        + '<span data-only="en">Go straight to the source</span><span data-only="fa">مستقیم سراغِ منبع برو</span></div>'
        + '<div class="golist" id="goHost"></div></div>'

      + h2('apply', 6, { en: ' Apply it this week', fa: ' این هفته امتحانش کن' })
      + '<p class="sub" data-only="en">Four small moves that turn the idea into a habit.</p>'
      + '<p class="sub" data-only="fa">چهار حرکتِ کوچک که این ایده را به عادت تبدیل می‌کنند.</p>'
      + '<div class="rec" id="recHost"></div>'

      + h2('method', 7, { en: ' Sources &amp; notes', fa: ' منابع و توضیح' })
      + '<div class="card method" id="methodHost"></div>'

      /* ── credit footer ── */
      + '<div class="credit">'
        + '<div><span data-only="en">Created by <span class="cname">Behnam Atefi</span><span class="sep">·</span>'
          + '<a class="li" href="https://www.linkedin.com/in/behnamatefi/" target="_blank" rel="noopener">' + IC.li + 'LinkedIn</a></span>'
        + '<span data-only="fa">ساخته‌شده توسط <span class="cname">بهنام عاطفی</span><span class="sep">·</span>'
          + '<a class="li" href="https://www.linkedin.com/in/behnamatefi/" target="_blank" rel="noopener">' + IC.li + 'لینکدین</a></span></div>'
        + '<div class="foot-close">'
          + '<span data-only="en">Product Builder’s Library</span>'
          + '<span data-only="fa">کتابخانهٔ سازندهٔ محصول</span>'
        + '</div>'
      + '</div>'
    + '</div>';

    var app = document.getElementById('app') || document.body;
    app.innerHTML = html;
  }
  function metaItem(k, v) {
    return '<div class="metaitem"><span class="mk" data-only="en">' + k.en + '</span><span class="mk" data-only="fa">' + k.fa + '</span>'
      + '<span class="mv" data-only="en">' + esc0(v.en) + '</span><span class="mv" data-only="fa">' + esc0(v.fa) + '</span></div>';
  }
  function tocLink(id, o) {
    return '<a href="#' + id + '" data-only="en">' + o.en + '</a><a href="#' + id + '" data-only="fa">' + o.fa + '</a>';
  }
  function h2(id, n, o) {
    var nn = ('0' + n).slice(-2);   /* instrument index: 01 … 07 */
    return '<h2 id="' + id + '"><span class="num" data-only="en">' + nn + ' //</span><span class="num" data-only="fa">' + faDigits(nn) + ' //</span>'
      + '<span data-only="en">' + o.en + '</span><span data-only="fa">' + o.fa + '</span></h2>';
  }

  /* ── LIBRARY NAV wiring (prev / next / all-books overlay) ───────────────── */
  function bookHref(e) { return '../' + e.folder + '/' + e.slug + '.html'; }
  function renderLibraryNav(m) {
    var lib = window.LIBRARY || [];
    var idx = -1;
    for (var i = 0; i < lib.length; i++) { if (lib[i].slug === m.slug) { idx = i; break; } }

    var prev = document.getElementById('navPrev'), next = document.getElementById('navNext');
    function wire(btn, entry) {
      if (!btn) return;
      if (entry) {
        btn.setAttribute('href', bookHref(entry));
        btn.removeAttribute('aria-disabled');
        btn.setAttribute('title', (LANG === 'fa' ? '' : '') + (entry.book.en));
      } else {
        btn.removeAttribute('href');
        btn.setAttribute('aria-disabled', 'true');
      }
    }
    wire(prev, idx > 0 ? lib[idx - 1] : null);
    wire(next, idx >= 0 && idx < lib.length - 1 ? lib[idx + 1] : null);

    /* build overlay grid grouped by skill group */
    var grid = document.getElementById('libGrid');
    if (grid) {
      var groups = [];
      lib.forEach(function (e) {
        var g = groups[e.groupNum - 1];
        if (!g) { g = groups[e.groupNum - 1] = { num: e.groupNum, name: e.group, books: [] }; }
        g.books.push(e);
      });
      grid.innerHTML = groups.filter(Boolean).map(function (g) {
        var links = g.books.map(function (e) {
          var cur = e.slug === m.slug ? ' cur' : '';
          return '<a class="' + cur.trim() + '" href="' + bookHref(e) + '">'
            + '<span data-only="en">' + esc0(e.book.en) + '</span><span data-only="fa">' + esc0(e.book.fa) + '</span></a>';
        }).join('');
        return '<div class="libgroup"><div class="lgh"><span class="lgn">' + num(g.num) + '</span>'
          + '<span class="lgt"><span data-only="en">' + esc0(g.name.en) + '</span><span data-only="fa">' + esc0(g.name.fa) + '</span></span></div>'
          + links + '</div>';
      }).join('');
    }

    var overlay = document.getElementById('libOverlay');
    var openBtn = document.getElementById('navAll'), closeBtn = document.getElementById('libClose');
    var libTimer = null, libLastFocus = null;
    function open() {
      if (!overlay) return;
      if (libTimer) { clearTimeout(libTimer); libTimer = null; }
      overlay.classList.remove('closing');
      overlay.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      /* return focus here on close — Safari/Firefox don't focus buttons on click,
         so fall back to the opener instead of document.body */
      var ae = document.activeElement;
      libLastFocus = (ae && ae !== document.body && ae !== document.documentElement) ? ae : openBtn;
      var cb = document.getElementById('libClose');
      if (cb) { try { cb.focus({ preventScroll: true }); } catch (e) { cb.focus(); } }
    }
    function finishClose() {
      libTimer = null;
      overlay.classList.remove('open');
      overlay.classList.remove('closing');
      document.documentElement.style.overflow = '';
      if (libLastFocus && libLastFocus.focus) { try { libLastFocus.focus({ preventScroll: true }); } catch (e) {} }
      libLastFocus = null;
    }
    function close() {
      if (!overlay || !overlay.classList.contains('open') || libTimer) return;
      /* exit rides the entrance path back out, faster (.18s) — skipped
         entirely under prefers-reduced-motion */
      var reduce = false;
      try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      if (reduce) { finishClose(); return; }
      overlay.classList.add('closing');
      libTimer = setTimeout(finishClose, 190);
    }
    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ── TEXT SECTIONS (tldr, quotes, media, go, recs, method, flow) ────────── */
  function elClear(id) { var e = document.getElementById(id); if (e) e.innerHTML = ''; return e; }
  function renderText() {
    var t = elClear('tldrHost');
    DATA.tldr.forEach(function (o) { var li = document.createElement('li'); li.innerHTML = TX(o); t.appendChild(li); });

    var q = elClear('quoteHost');
    DATA.quotes.forEach(function (o) {
      var bq = document.createElement('blockquote');
      bq.innerHTML = '<span class="qm">“</span><p>' + TX(o) + '</p>';
      q.appendChild(bq);
    });

    var m = elClear('mediaHost');
    DATA.media.forEach(function (o) {
      var card = document.createElement('div'); card.className = 'mcard';
      var thumb;
      if (o.kind === 'yt') {
        var url = 'https://www.youtube.com/watch?v=' + o.id;
        var img = 'https://i.ytimg.com/vi/' + o.id + '/hqdefault.jpg';
        thumb = '<a class="mthumb" href="' + url + '" target="_blank" rel="noopener">'
          + '<img src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
          + '<span class="ptype">' + (LANG === 'fa' ? 'ویدیو' : 'VIDEO') + '</span>'
          + '<span class="play"><span>' + IC.play + '</span></span></a>';
      } else {
        thumb = '<a class="mthumb" href="' + o.url + '" target="_blank" rel="noopener"><span class="mfake">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>'
          + '</span><span class="ptype">' + (LANG === 'fa' ? 'تصویر' : 'IMAGE') + '</span></a>';
      }
      var link = o.kind === 'yt' ? 'https://www.youtube.com/watch?v=' + o.id : o.url;
      var bl = (LANG === 'fa' ? o.bullets.fa : o.bullets.en).map(function (b) { return '<li>' + (LANG === 'fa' ? faText(b) : b) + '</li>'; }).join('');
      card.innerHTML = thumb + '<div class="mbody">'
        + '<div class="msrc">' + TX(o.src) + '</div>'
        + '<h4>' + TX(o.title) + '</h4>'
        + '<p class="mdesc">' + TX(o.desc) + '</p>'
        + '<ul>' + bl + '</ul>'
        + '<a class="mlink" href="' + link + '" target="_blank" rel="noopener">' + (LANG === 'fa' ? 'باز کردن ↗' : 'Open ↗') + '</a>'
        + '<div class="mbest">' + TX(o.best) + '</div>'
        + '</div>';
      m.appendChild(card);
    });

    var g = elClear('goHost');
    DATA.go.forEach(function (o) {
      var a = document.createElement('a'); a.href = o.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = TX(o.label); g.appendChild(a);
    });

    var r = elClear('recHost');
    DATA.recs.forEach(function (o) {
      var it = document.createElement('div'); it.className = 'item';
      var priLabel = o.pri === 'b' ? (LANG === 'fa' ? 'از اینجا شروع کن' : 'Start here') : (LANG === 'fa' ? 'بعدش این' : 'Then this');
      it.innerHTML = '<div class="t">' + TX(o.t) + '<span class="pri ' + (o.pri === 'b' ? 'b' : '') + '">' + priLabel + '</span></div>'
        + '<div class="d">' + TX(o.d) + '</div>';
      r.appendChild(it);
    });

    var mth = document.getElementById('methodHost');
    if (mth && DATA.method) mth.innerHTML = LANG === 'fa' ? faText(DATA.method.fa) : DATA.method.en;

    var fl = document.getElementById('flowTop');
    if (fl && DATA.flow) {
      var loop = LANG === 'fa' ? DATA.flow.fa : DATA.flow.en;
      var ar = LANG === 'fa' ? '⟵' : '⟶';
      fl.innerHTML = loop.map(function (w) { return '<b>' + (LANG === 'fa' ? faText(w) : w) + '</b>'; }).join(' <span class="ar">' + ar + '</span> ');
    }
  }

  /* ── CONCEPT MAP ────────────────────────────────────────────────────────── */
  function renderMap() {
    var host = document.getElementById('mapHost'); if (!host) return; host.innerHTML = '';
    DATA.parts.forEach(function (p, i) {
      var col = document.createElement('div'); col.className = 'partcol';
      var chaps = p.chapters.map(function (ck) {
        var c = DATA.chapters[ck];
        return '<div class="chapchip"><span class="cn">' + num(c.n) + '</span><div><b>' + TX(c.name) + '</b>'
          + '<small>' + TX(c.principle).replace(/<[^>]+>/g, '').slice(0, LANG === 'fa' ? 86 : 76) + '…</small></div></div>';
      }).join('');
      col.innerHTML = '<div class="ph"><span class="pdot" style="background:var(' + p.varc + ')"></span>'
        + '<span class="pnum">' + (LANG === 'fa' ? 'بخشِ ' : 'PART ') + num(i + 1) + '</span></div>'
        + '<h4>' + TX(p.name) + '</h4>'
        + '<div class="ptag" style="color:var(' + p.varc + ')">' + TX(p.tag) + '</div>'
        + '<p class="pgist">' + TX(p.gist) + '</p>' + chaps;
      host.appendChild(col);
    });
  }

  /* ── INTERACTIVE NETWORK GRAPH (deterministic radial layout, no physics) ── */
  var GRAPH = (function () {
    var svg, nodes = [], links = [], sel = null, dragNode = null, dragEl = null, moved = false, startPt = null;
    var detailTimer = null;                        /* pending readout-swap exit */
    var vbX = 0, vbY = 0, vbW = 1360, vbH = 760;   // fitted viewBox (computed from node bbox so nothing clips)

    function build() {
      svg = document.getElementById('netsvg');
      var gp = DATA.graph || {};
      /* elliptical layout in a nominal space; the viewBox is then FITTED to the node
         bounding box so no node/label ever clips, on any book (any part/chapter count). */
      var cx = 680, cy = 380;
      var Rx = 470, Ry = 210;                                   // parts ellipse (wide, short)
      var R2 = Math.min((gp.R2 || 140) * 1.05, 150);            // chapter fan radius
      var span = (gp.span || 74) * Math.PI / 180;
      nodes = []; links = [];
      var N = DATA.parts.length, partAng = DATA.parts.map(function (_, i) { return -Math.PI / 2 + i * (2 * Math.PI / N); });
      nodes.push({ id: 'core', kind: 'core', varc: '--core', r: 46, x: cx, y: cy, label: DATA.core.name, data: DATA.core });
      DATA.parts.forEach(function (p, i) {
        var a = partAng[i], px = cx + Math.cos(a) * Rx, py = cy + Math.sin(a) * Ry;
        nodes.push({ id: 'p_' + p.key, kind: 'part', varc: p.varc, r: 30, x: px, y: py,
          label: p.name, data: { name: p.name, principle: p.gist, more: p.more, tag: p.tag, key: p.key } });
        links.push({ s: 'core', t: 'p_' + p.key, strong: true });
        var nc = p.chapters.length, start = a - span / 2;
        p.chapters.forEach(function (ck, j) {
          var ca = nc > 1 ? start + span * (j / (nc - 1)) : a;
          var c = DATA.chapters[ck];
          nodes.push({ id: 'c_' + ck, kind: 'chap', varc: p.varc, r: 18,
            x: px + Math.cos(ca) * R2, y: py + Math.sin(ca) * R2,
            label: (c.glabel || c.name), data: c, ck: ck });
          links.push({ s: 'p_' + p.key, t: 'c_' + ck });
        });
      });
      /* fit viewBox to content: include node radius + the label that sits below each node */
      var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      nodes.forEach(function (n) {
        var below = n.kind === 'core' ? n.r : n.r + 26;         // label extends below non-core nodes
        var hw = n.kind === 'part' ? 78 : (n.kind === 'chap' ? 52 : n.r); // rough label half-width
        minX = Math.min(minX, n.x - Math.max(n.r, hw));
        maxX = Math.max(maxX, n.x + Math.max(n.r, hw));
        minY = Math.min(minY, n.y - n.r);
        maxY = Math.max(maxY, n.y + below);
      });
      var pad = 34;
      vbX = minX - pad; vbY = minY - pad; vbW = (maxX - minX) + pad * 2; vbH = (maxY - minY) + pad * 2;
      svg.setAttribute('viewBox', vbX.toFixed(0) + ' ' + vbY.toFixed(0) + ' ' + vbW.toFixed(0) + ' ' + vbH.toFixed(0));
      nodes.forEach(function (n) { n.hx = n.x; n.hy = n.y; n.vx = 0; n.vy = 0; });
      /* each link remembers its designed length — the spring's rest state */
      links.forEach(function (l) {
        var a = byId(l.s), b = byId(l.t);
        l.rest = Math.hypot(b.x - a.x, b.y - a.y);
      });
      draw();
      select('core');
    }
    function byId(id) { for (var i = 0; i < nodes.length; i++) if (nodes[i].id === id) return nodes[i]; return null; }

    function draw() {
      var ln = '', nd = '';
      links.forEach(function (l) { ln += '<path class="glink" data-s="' + l.s + '" data-t="' + l.t + '" stroke="var(--line)" stroke-width="' + (l.strong ? 2 : 1.4) + '"/>'; });
      nodes.forEach(function (n) {
        var inside = '', below = '';
        if (n.kind === 'core') {
          /* core is the orange lamp — ink on orange is always black (--sig-ink) */
          inside = '<text text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="500" fill="var(--sig-ink)" letter-spacing="0.5">' + shortLabel(n) + '</text>';
        } else {
          if (n.kind === 'chap') {
            /* chapter discs use the tonal ramp — each tone has its own AA numeral
               ink token (--cink-*) so numerals pass contrast in BOTH themes */
            var cink = String(n.varc).replace('--c-', '--cink-');
            inside = '<text text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" fill="var(' + cink + ', var(--bg))">' + num(n.data.n) + '</text>';
          }
          var ly = n.r + (n.kind === 'part' ? 21 : 17);
          var fs = n.kind === 'part' ? 16 : 13;
          var stroke = 'paint-order:stroke;stroke:var(--bg2);stroke-width:4px;stroke-linejoin:round';
          below = '<text class="nlab" text-anchor="middle" y="' + ly + '" font-size="' + fs + '" font-weight="' + (n.kind === 'part' ? '500' : '400') + '" fill="var(--ink)" style="' + stroke + '">' + shortLabel(n) + '</text>';
        }
        nd += '<g class="node' + (n.kind === 'core' ? ' ncore' : '') + '" data-id="' + n.id + '"'
          + ' tabindex="0" role="button" aria-label="' + esc(TX(n.label)) + '"><g class="ns">'
          + '<circle r="' + n.r + '" fill="var(' + n.varc + ')" fill-opacity="' + (n.kind === 'chap' ? 0.9 : 1) + '" stroke="var(--bg2)" stroke-width="2"/>'
          + inside + below + '</g></g>';
      });
      svg.innerHTML = '<g id="glinks">' + ln + '</g><g id="grel"></g><g id="gnodes">' + nd + '</g>';
      svg.querySelectorAll('.node').forEach(function (gEl) {
        gEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(gEl.getAttribute('data-id')); } });
        gEl.addEventListener('pointerdown', onDown);
        gEl.addEventListener('click', function () { if (!moved) select(gEl.getAttribute('data-id')); });
        gEl.addEventListener('pointerenter', function () { if (!dragNode) gEl.classList.add('hover'); });
        gEl.addEventListener('pointerleave', function () { gEl.classList.remove('hover'); });
      });
      positions();
    }
    function shortLabel(n) { return TX(n.label); }

    /* gentle quadratic arc between two nodes (Linear-style curved connectors) */
    function linkPath(a, b, curv) {
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
      var k = curv == null ? 0.10 : curv;
      var cxp = mx - dy * k, cyp = my + dx * k;
      return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cxp.toFixed(1) + ' ' + cyp.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    }
    function positions() {
      svg.querySelectorAll('.node').forEach(function (g) {
        var n = byId(g.getAttribute('data-id'));
        g.setAttribute('transform', 'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')');
      });
      svg.querySelectorAll('.glink,.rel').forEach(function (l) {
        var a = byId(l.getAttribute('data-s')), b = byId(l.getAttribute('data-t'));
        if (a && b) l.setAttribute('d', linkPath(a, b, l.classList.contains('rel') ? 0.14 : 0.10));
      });
    }

    function toSvg(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM(); if (!m) return { x: e.clientX, y: e.clientY };
      return pt.matrixTransform(m.inverse());
    }
    /* ── FORCE SIMULATION — the graph is context-aware: dragging any node
       makes its neighbours give way and follow. Springs on every link pull
       toward the designed length, close nodes repel so nothing overlaps, and
       a weak "home" anchor keeps the overall composition legible and settles
       everything back to order after release. The loop parks itself when the
       energy drops, and prefers-reduced-motion gets the old single-node drag. */
    var SIM = { raf: null, on: true };
    try { SIM.on = !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var K_LINK = 0.028, K_HOME = 0.012, K_REPEL = 210, DAMP = 0.80, VMAX = 11, SLEEP = 0.035;

    function clampNode(n) {
      n.x = Math.max(vbX + n.r, Math.min(vbX + vbW - n.r, n.x));
      n.y = Math.max(vbY + n.r, Math.min(vbY + vbH - n.r, n.y));
    }
    function simStep() {
      var i, j, a, b, dx, dy, d, f;
      /* springs along links */
      for (i = 0; i < links.length; i++) {
        var l = links[i]; a = byId(l.s); b = byId(l.t);
        dx = b.x - a.x; dy = b.y - a.y; d = Math.hypot(dx, dy) || 1;
        f = K_LINK * (d - l.rest) / d;
        if (a !== dragNode) { a.vx += dx * f; a.vy += dy * f; }
        if (b !== dragNode) { b.vx -= dx * f; b.vy -= dy * f; }
      }
      /* short-range repulsion (n is small — O(n²) is cheap here) */
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y; d = dx * dx + dy * dy;
        var min = a.r + b.r + 42;
        if (d > min * min || d === 0) continue;
        d = Math.sqrt(d); f = K_REPEL * (1 - d / min) / (d * d);
        if (a !== dragNode) { a.vx -= dx * f * d; a.vy -= dy * f * d; }
        if (b !== dragNode) { b.vx += dx * f * d; b.vy += dy * f * d; }
      }
      /* weak pull home + integrate */
      var energy = 0;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i]; if (a === dragNode) continue;
        a.vx += (a.hx - a.x) * K_HOME; a.vy += (a.hy - a.y) * K_HOME;
        a.vx *= DAMP; a.vy *= DAMP;
        /* terminal velocity — context shifts stay calm, never explosive */
        var sp = Math.hypot(a.vx, a.vy);
        if (sp > VMAX) { a.vx = a.vx / sp * VMAX; a.vy = a.vy / sp * VMAX; }
        a.x += a.vx; a.y += a.vy;
        clampNode(a);
        energy += a.vx * a.vx + a.vy * a.vy;
      }
      return energy;
    }
    function simLoop() {
      var e = simStep();
      positions();
      if (dragNode || e > SLEEP) { SIM.raf = requestAnimationFrame(simLoop); }
      else { SIM.raf = null; }
    }
    function simWake() {
      if (!SIM.on) { positions(); return; }
      if (SIM.raf == null) SIM.raf = requestAnimationFrame(simLoop);
    }

    var lastPt = null, lastPrev = null;
    function onDown(e) {
      e.preventDefault();
      dragNode = byId(e.currentTarget.getAttribute('data-id'));
      dragEl = e.currentTarget;
      moved = false; startPt = toSvg(e); svg.style.cursor = 'grabbing';
      lastPt = { x: dragNode.x, y: dragNode.y }; lastPrev = lastPt;
      dragEl.classList.remove('hover');
      dragEl.classList.add('drag');           /* CSS lift while it travels */
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      simWake();
    }
    function onMove(e) {
      if (!dragNode) return; var p = toSvg(e);
      if (startPt && (Math.abs(p.x - startPt.x) > 4 || Math.abs(p.y - startPt.y) > 4)) moved = true;
      lastPrev = lastPt; lastPt = { x: p.x, y: p.y };
      dragNode.x = p.x; dragNode.y = p.y; clampNode(dragNode);
      dragNode.vx = 0; dragNode.vy = 0;
      /* the grabbed node tracks 1:1 — never deferred to the next frame; one
         synchronous sim step makes the neighbours give way immediately too */
      if (SIM.on) { simStep(); simWake(); }
      positions();
    }
    function onUp() {
      if (dragEl) dragEl.classList.remove('drag');
      /* hand the release velocity to the node so a flick carries momentum */
      if (dragNode && lastPt && lastPrev && SIM.on) {
        dragNode.vx = (lastPt.x - lastPrev.x) * 0.9;
        dragNode.vy = (lastPt.y - lastPrev.y) * 0.9;
      }
      dragNode = null; dragEl = null; svg.style.cursor = 'grab';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      simWake();
    }

    function keepSet(id) {
      var n = byId(id); if (!n || id === 'core') return null;
      var keep = {}; keep[id] = 1; keep['core'] = 1;
      var pk = (n.kind === 'part') ? n.data.key : n.data.part;
      keep['p_' + pk] = 1;
      DATA.parts.forEach(function (p) { if (p.key === pk) p.chapters.forEach(function (ck) { keep['c_' + ck] = 1; }); });
      return keep;
    }
    function applyFocus(id) {
      var keep = keepSet(id), full = (keep === null);
      svg.querySelectorAll('.node').forEach(function (g) {
        var nid = g.getAttribute('data-id');
        g.classList.toggle('dim', !full && !keep[nid]);
        g.classList.toggle('hl', !full && keep[nid] && nid !== id);
      });
      svg.querySelectorAll('.glink').forEach(function (l) {
        var s = l.getAttribute('data-s'), t = l.getAttribute('data-t');
        var on = full || (keep[s] && keep[t]);
        l.classList.toggle('dim', !on);
        l.classList.toggle('hl', !full && on);
      });
    }
    function relatedIds(node) {
      var ids = [];
      if (node.id === 'core') { DATA.parts.forEach(function (p) { ids.push('p_' + p.key); }); }
      else if (node.kind === 'part') { var pk = node.data.key; DATA.parts.forEach(function (p) { if (p.key === pk) p.chapters.forEach(function (ck) { ids.push('c_' + ck); }); }); }
      else {
        var pk2 = node.data.part; ids.push('p_' + pk2);
        DATA.parts.forEach(function (p) { if (p.key === pk2) p.chapters.forEach(function (ck) { if ('c_' + ck !== node.id) ids.push('c_' + ck); }); });
      }
      return ids;
    }
    function drow(cls, label, txt) { return '<div class="drow ' + cls + '"><div class="dlab">' + label + '</div><div class="dtxt">' + txt + '</div></div>'; }

    /* draw animated connector lines from the selected node to its related items/topics */
    function drawRelations(node) {
      var g = svg.querySelector('#grel'); if (!g) return;
      var rel = relatedIds(node), html = '';
      rel.forEach(function (rid, ri) {
        var b = byId(rid); if (!b) return;
        var d = linkPath(node, b, 0.14);
        var len = Math.hypot(b.x - node.x, b.y - node.y) * 1.5;
        /* sequential draw — the circuit traces one line at a time (45ms apart) */
        html += '<path class="rel draw" data-s="' + node.id + '" data-t="' + rid + '" style="--len:' + len.toFixed(0) + ';animation-delay:' + (ri * 45) + 'ms" stroke-width="2.2" d="' + d + '"/>';
      });
      g.innerHTML = html;
    }

    function select(id, instant) {
      var n = byId(id); if (!n) return;
      sel = id;
      svg.querySelectorAll('.node').forEach(function (g) { g.classList.toggle('sel', g.getAttribute('data-id') === id); });
      var selEl = svg.querySelector('.node[data-id="' + id + '"]'); if (selEl && selEl.parentNode) selEl.parentNode.appendChild(selEl);
      applyFocus(id);
      drawRelations(n);
      var d = n.data, pv = n.kind === 'core' ? '--core' : n.varc;
      var kicker = n.kind === 'core' ? (LANG === 'fa' ? 'ایدهٔ مرکزی' : 'Core idea')
        : n.kind === 'part' ? (LANG === 'fa' ? 'بخش' : 'Part') + ' · ' + TX(d.tag)
          : (LANG === 'fa' ? 'ایدهٔ' : 'Idea') + ' ' + num(d.n);
      var prLab = (n.kind === 'chap') ? (LANG === 'fa' ? 'اصل' : 'Principle') : (LANG === 'fa' ? 'ایدهٔ اصلی' : 'Big idea');
      var html = '<div class="dkick"><i style="background:var(' + pv + ')"></i>' + (LANG === 'fa' ? faText(kicker) : kicker) + '</div>'
        + '<h4>' + TX(d.name) + '</h4>'
        + drow('', prLab, TX(d.principle));
      if (d.more) html += drow('more', (LANG === 'fa' ? 'بیشتر' : 'In depth'), TX(d.more));
      if (d.example) html += drow('', (LANG === 'fa' ? 'مثال' : 'Example'), TX(d.example));
      if (d.tip) html += drow('tip', (LANG === 'fa' ? 'امتحان کن' : 'Try this'), TX(d.tip));
      if (d.pitfall) html += drow('pit', (LANG === 'fa' ? 'حواست باشد' : 'Watch out'), TX(d.pitfall));
      var rel = relatedIds(n);
      if (rel.length) {
        var chips = rel.map(function (rid) { var rn = byId(rid); if (!rn) return '';
          return '<span class="dchip" data-goto="' + rid + '"><i style="background:var(' + rn.varc + ')"></i>' + TX(rn.data.name) + '</span>'; }).join('');
        html += '<div class="drow"><div class="dlab">' + (LANG === 'fa' ? 'مرتبط' : 'Related') + '</div><div class="dchips">' + chips + '</div></div>';
      }
      var host = document.getElementById('detailHost');
      function apply() {
        host.classList.remove('out');
        host.innerHTML = html;
        host.classList.remove('pop'); void host.offsetWidth; host.classList.add('pop');  // restart materialize on each select
        host.querySelectorAll('.dchip').forEach(function (c) {
          c.addEventListener('click', function () { select(c.getAttribute('data-goto')); });
        });
      }
      /* exit-then-enter: the old readout blinks out (.12s) before the new one
         materializes — the graph itself responds instantly (focus + relations
         above), only the panel follows. Instant on first paint, full re-renders
         (relabel) and under prefers-reduced-motion. */
      var reduce = false;
      try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      if (detailTimer) { clearTimeout(detailTimer); detailTimer = null; }
      if (instant || reduce || !host.innerHTML) { apply(); return; }
      host.classList.add('out');
      detailTimer = setTimeout(function () { detailTimer = null; apply(); }, 110);
    }
    /* full re-render (language flip) — swap the readout without replaying the exit */
    function relabel() { if (!svg) return; draw(); select(sel || 'core', true); }

    return {
      build: build,
      kick: function () {},
      relabel: relabel,
      reset: function () {
        if (SIM.on) { nodes.forEach(function (n) { n.vx = (n.hx - n.x) * 0.2; n.vy = (n.hy - n.y) * 0.2; }); simWake(); }
        else { nodes.forEach(function (n) { n.x = n.hx; n.y = n.hy; }); positions(); }
      },
      resetFocus: function () { select('core'); },
      selectNode: function (id) { select(id); },
      hasNodes: function () { return nodes.length > 0; }
    };
  })();

  /* ── 5-STAGE LADDER ─────────────────────────────────────────────────────── */
  var curStage = 0, ladderSettled = false, stageSettled = false;
  /* HUD grammar for the rung label — "STAGE 1 // ELI5" (the annotation layer the
     component is named for). EN tags are fixed per level; FA reuses the short
     tag already in the stage badge ("سطحِ ۱ · خیلی ساده" → "خیلی ساده"). */
  var STAGE_TAG_EN = { 1: 'ELI5', 2: 'Simple', 3: 'Balanced', 4: 'Advanced', 5: 'Expert' };
  function rungLabel(s) {
    if (LANG === 'fa') {
      var tf = (s.badge && s.badge.fa && s.badge.fa.indexOf('·') > -1) ? s.badge.fa.split('·')[1].trim() : '';
      return 'سطحِ ' + num(s.level) + (tf ? ' // ' + tf : '');
    }
    var te = STAGE_TAG_EN[s.level] || ((s.badge && s.badge.en && s.badge.en.indexOf('·') > -1) ? s.badge.en.split('·')[1].trim() : '');
    return 'Stage ' + s.level + (te ? ' // ' + te : '');
  }
  function renderLadder() {
    var host = document.getElementById('ladderHost'); host.innerHTML = '';
    /* after the first paint the entrance cascade never replays (see book.css
       .ladder[data-settled]) — rung clicks and language flips stay instant */
    if (ladderSettled) host.setAttribute('data-settled', '1');
    DATA.stages.forEach(function (s, i) {
      var r = document.createElement('div'); r.className = 'rung' + (i === curStage ? ' active' : '');
      r.innerHTML = '<div class="lv">' + rungLabel(s) + '</div>'
        + '<div class="lt">' + TX(s.title) + '</div>'
        ;
      r.addEventListener('click', function () {
        curStage = i; renderLadder(); renderStage();
        document.getElementById('stageHost').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      host.appendChild(r);
    });
    ladderSettled = true;
  }
  function renderStage() {
    var s = DATA.stages[curStage];
    var host = document.getElementById('stageHost');
    /* after the first paint the swap cascade never replays (see book.css
       #stageHost[data-settled]) — rung clicks and language flips stay instant */
    if (stageSettled) host.setAttribute('data-settled', '1');
    var exLabel = LANG === 'fa' ? 'مثال' : 'Example';
    var prev = LANG === 'fa' ? 'مرحلهٔ قبل' : '‹ Prev', next = LANG === 'fa' ? 'مرحلهٔ بعد' : 'Next ›';
    host.innerHTML = ''
      + '<div class="stagecard">'
      + '<div class="shead"><span class="badge">' + TX(s.badge) + '</span><h3>' + TX(s.title) + '</h3></div>'
      + '<div class="tagline">' + TX(s.tagline) + '</div>'
      + '<div class="sbody">' + TX(s.body) + '</div>'
      + '<div class="exbox"><div class="exk">' + exLabel + '</div><div class="ext">' + TX(s.example) + '</div></div>'
      + '<div class="gainrow"><span class="gi">✓</span><span>' + TX(s.gain) + '</span></div>'
      + '<div class="stagenav">'
        + '<button id="stPrev" ' + (curStage === 0 ? 'disabled' : '') + '>' + prev + '</button>'
        + '<button id="stNext" ' + (curStage === DATA.stages.length - 1 ? 'disabled' : '') + '>' + next + '</button>'
      + '</div></div>';
    var pv = document.getElementById('stPrev'), nx = document.getElementById('stNext');
    if (pv) pv.onclick = function () { if (curStage > 0) { curStage--; renderLadder(); renderStage(); } };
    if (nx) nx.onclick = function () { if (curStage < DATA.stages.length - 1) { curStage++; renderLadder(); renderStage(); } };
    stageSettled = true;
  }

  /* ── legend + graph tabs ────────────────────────────────────────────────── */
  function renderLegend() {
    var host = document.getElementById('legendHost'); if (!host) return;
    var items = [{ c: '--core', en: 'Core idea', fa: 'ایدهٔ مرکزی' }]
      .concat(DATA.parts.map(function (p) { return { c: p.varc, en: p.name.en, fa: p.name.fa }; }));
    host.innerHTML = items.map(function (it) {
      return '<span><i style="background:var(' + it.c + ')"></i>' + (LANG === 'fa' ? faText(it.fa) : it.en) + '</span>';
    }).join('');
    /* "//" prefix — the graph chrome speaks the same HUD annotation grammar it
       floats over (language-neutral punctuation, renders at the logical start in RTL) */
    document.getElementById('ghint').textContent = LANG === 'fa' ? '// روی هر دایره کلیک کن تا بیشتر بخوانی · می‌توانی بکشی‌شان' : '// Click a node to read more · drag to move';
    document.getElementById('greset').textContent = LANG === 'fa' ? '↺ چیدمان' : '↺ Reset';
  }
  function setupTabs() {
    function show(net) {
      document.getElementById('netView').style.display = net ? '' : 'none';
      document.getElementById('mapView').style.display = net ? 'none' : '';
      var tn = document.getElementById('tabNet'), tm = document.getElementById('tabMap');
      tn.classList.toggle('active', net);  tn.setAttribute('aria-pressed', net ? 'true' : 'false');
      tm.classList.toggle('active', !net); tm.setAttribute('aria-pressed', net ? 'false' : 'true');
      if (net) GRAPH.kick();
    }
    document.getElementById('tabNet').onclick = function () { show(true); };
    document.getElementById('tabMap').onclick = function () { show(false); };
    document.getElementById('greset').onclick = function () { GRAPH.reset(); };
    var svg = document.getElementById('netsvg');
    svg.addEventListener('click', function (e) { if (!e.target.closest('.node')) GRAPH.resetFocus(); });
  }

  /* ── toggles + boot ─────────────────────────────────────────────────────── */
  function setLang(lg) {
    LANG = lg;
    document.documentElement.setAttribute('data-lang', lg);
    document.documentElement.setAttribute('lang', lg);
    document.documentElement.setAttribute('dir', lg === 'fa' ? 'rtl' : 'ltr');
    try { localStorage.setItem('pbl-lang', lg); } catch (e) {}
    renderAll();
  }
  function renderAll() {
    renderText();
    renderMap();
    renderLegend();
    renderLadder();
    renderStage();
    if (GRAPH.hasNodes()) GRAPH.relabel(); else GRAPH.build();
  }

  function wireChrome() {
    var lb = document.getElementById('langBtn');
    if (lb) lb.addEventListener('click', function () { setLang(LANG === 'fa' ? 'en' : 'fa'); });

    var tb = document.getElementById('themeBtn');
    function curT() { return document.documentElement.getAttribute('data-theme'); }
    if (tb) tb.addEventListener('click', function () {
      var t = curT() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('pbl-theme', t); } catch (e) {}
    });
    try {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('pbl-theme')) { document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light'); }
      });
    } catch (e) {}

    /* scroll-spy */
    var links = [].slice.call(document.querySelectorAll('.toc a'));
    var seen = {}, ids = [];
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (!seen[id]) { seen[id] = 1; ids.push(id); } });
    var secs = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    function setActive(id) { links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); }); }
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      secs.forEach(function (s) { obs.observe(s); });
    }
  }

  /* ── public entry point ─────────────────────────────────────────────────── */
  function mount(data) {
    DATA = data;
    if (!DATA || !DATA.meta) { console.error('Book.mount: DATA.meta missing'); return; }
    LANG = document.documentElement.getAttribute('data-lang') || 'en';
    renderShell(DATA.meta);
    renderLibraryNav(DATA.meta);
    setupTabs();
    renderAll();
    wireChrome();
  }

  window.Book = { mount: mount };
})();
