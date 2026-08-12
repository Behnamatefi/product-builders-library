/* ============================================================================
   graph-camera.js — window.GraphCamera
   ----------------------------------------------------------------------------
   The shared engine behind both knowledge graphs: the per-book map rendered by
   assets/book.js and the whole-library Atlas in graph.html. Before this file
   the two were a near-verbatim fork of each other, differing only in six
   tuning constants — every fix had to be written twice.

   It owns four things:

     PHYSICS   springs along links, short-range repulsion, a weak home anchor,
               terminal velocity, and an rAF loop that parks itself when the
               energy drops. Dragging a node makes its neighbours give way.
     POINTER   node drag, background pan, and pinch — with pointer-id ownership
               so a second finger can't hijack a drag, and a pointercancel
               teardown so an interrupted touch can't strand one.
     CAMERA    zoom and pan via a transform group, cursor-anchored.
     CHROME    the zoom / fit / expand cluster, and the click-to-engage state
               that decides whether a plain wheel scrolls the page or zooms.

   THREE COORDINATE SPACES, which the old code conflated into one set of vars:

     world   where nodes live. clampNode() reads ONLY this, so the physics is
             untouched by the camera.
     stage   the viewBox — a fixed frame the camera moves within. Kept at the
             element's aspect ratio so preserveAspectRatio="meet" is a no-op
             and k=1 means exactly "the whole world is visible".
     screen  CSS pixels.

     stage = k * world + t        screen = fit(stage)

   The camera is a <g transform> rather than a moving viewBox on purpose: with
   preserveAspectRatio="xMidYMid meet" a viewBox camera re-fits on whichever
   axis is tighter, so the rendered scale would be min(clientW/w, clientH/h) —
   not the zoom factor asked for — and the two would diverge by an
   aspect-dependent constant.

   Usage:

       var G = GraphCamera.create({ svg: el, host: wrapEl, physics: {...} });
       G.setGraph(nodes, links, world);
       G.layer.innerHTML = markup;      // NEVER svg.innerHTML — that eats the
       G.indexElements();               //   camera group
       G.paint();

   No build step, no dependencies — a plain script that attaches to window,
   the same shape as library.js / atlas.js / recommend.js.
   ========================================================================== */
(function () {
  'use strict';

  /* Identical in both callers, so they live here rather than in the per-graph
     constants: damping, the sleep threshold, and the release-flick scale. */
  var DAMP = 0.80, SLEEP = 0.035, FLICK = 0.9;

  /* A tap is a click, not a drag, if the pointer stayed within this many CSS
     pixels. The old code measured it in SVG user units, which meant the
     threshold shrank with the render scale — 0.79px on a phone, so taps
     registered as drags. Client pixels are scale-independent. */
  var TAP_SLOP = 4;
  var DBL_MS = 300, DBL_SLOP = 24;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function create(opts) {
    var svg = opts.svg;
    var host = opts.host || svg.parentNode;
    var P = opts.physics || {};
    var K_LINK = P.K_LINK != null ? P.K_LINK : 0.028;
    var K_HOME = P.K_HOME != null ? P.K_HOME : 0.012;
    var K_REPEL = P.K_REPEL != null ? P.K_REPEL : 210;
    var VMAX = P.VMAX != null ? P.VMAX : 11;
    var PAD = P.PAD != null ? P.PAD : 42;        /* repulsion floor above r+r */

    var C = opts.camera || {};
    var MIN_K = C.minK != null ? C.minK : 1;
    /* 8 is not arbitrary: at a 390px viewport the Atlas fits at ~0.2 scale, so
       reaching a 12px label needs k≈5.3. Anything under ~6 leaves the phone
       case unsolved. */
    var MAX_K = C.maxK != null ? C.maxK : 8;
    var WHEEL_RATE = C.wheelRate != null ? C.wheelRate : 0.0022;

    var CURV = opts.curv || { glink: 0.10, rel: 0.14, xlink: 0.22 };
    var S = opts.strings || {};

    var reduced = false;
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    /* ── graph state ──────────────────────────────────────────────────────── */
    var nodes = [], links = [], idx = {};
    var world = { x: 0, y: 0, w: 1000, h: 1000 };
    var stage = { x: 0, y: 0, w: 1000, h: 1000 };
    var nodeEls = [], edgeEls = [];

    /* ── camera state ─────────────────────────────────────────────────────── */
    var k = 1, tx = 0, ty = 0;
    var layer = null, engaged = false, expanded = false;
    var kPub = null, kTimer = null;

    /* ── the camera group ─────────────────────────────────────────────────── */
    /* Created once and never replaced. draw() must assign G.layer.innerHTML,
       because assigning svg.innerHTML would delete this element. */
    function ensureLayer() {
      if (layer && layer.parentNode === svg) return layer;
      layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      layer.setAttribute('id', 'cam');
      svg.appendChild(layer);
      return layer;
    }

    function applyCam() {
      ensureLayer().setAttribute('transform',
        'translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ') scale(' + k.toFixed(4) + ')');
      /* The label halo is stroke-width:4px = 4 USER units, so it inflates with
         the camera and turns into a blob that eats glyph counters at high zoom.
         book.css divides it by --k. Publishing a custom property invalidates
         style for every inheriting node in the subtree (~600 elements), so
         this is debounced to gesture end — a momentarily uncompensated halo
         mid-pinch is invisible. */
      /* button enable/disable is cheap and must not lag the gesture */
      syncButtons();
      if (kTimer) clearTimeout(kTimer);
      kTimer = setTimeout(function () {
        kTimer = null;
        if (kPub === k) return;
        kPub = k;
        host.style.setProperty('--k', k.toFixed(3));
        if (opts.onCamera) opts.onCamera(k, tx, ty);
      }, 120);
    }

    /* Continuous gestures must not fight a CSS transition, so the transition is
       only live for discrete zooms (buttons, keyboard, double-click). */
    function live(on) { ensureLayer().classList.toggle('live', !!on); }

    /* ── stage: keep the viewBox at the element's aspect ratio ────────────── */
    /* Expanding the world box symmetrically on the letterboxed axis is
       pixel-identical at rest — if height constrains, s = clientH/vbH and the
       expanded width gives min(clientW/stageW', clientH/vbH) = the same s —
       but it makes "meet" a no-op, so stage == the visible rect and the camera
       clamp can be exact. */
    function syncStage() {
      var r = svg.getBoundingClientRect();
      var cx = world.x + world.w / 2, cy = world.y + world.h / 2;
      var w, h;
      if (!r.width || !r.height) {
        /* not measurable yet — a hidden tab, a detached node, a zero-width
           viewport. Fall back to the plain world box so the viewBox is always
           written; the ResizeObserver refines it the moment the element gains
           a size. Leaving it unwritten would strand the markup's placeholder. */
        w = world.w; h = world.h;
      } else {
        var aspect = r.width / r.height;
        if (world.w / world.h < aspect) { h = world.h; w = h * aspect; }
        else { w = world.w; h = w / aspect; }
      }
      stage.w = w; stage.h = h;
      stage.x = cx - w / 2; stage.y = cy - h / 2;
      svg.setAttribute('viewBox',
        stage.x.toFixed(1) + ' ' + stage.y.toFixed(1) + ' ' + stage.w.toFixed(1) + ' ' + stage.h.toFixed(1));
      clampCam(); applyCam();
    }

    /* ── camera math ──────────────────────────────────────────────────────── */
    function clampCam() {
      /* A world point wx lands at k*wx + tx in stage space. Solve for the two
         edge-aligned translations; when the world is smaller than the view
         those cross over and we centre instead. */
      var loX = stage.x + stage.w - k * (world.x + world.w);
      var hiX = stage.x - k * world.x;
      tx = (loX > hiX) ? (hiX + loX) / 2 : clamp(tx, loX, hiX);
      var loY = stage.y + stage.h - k * (world.y + world.h);
      var hiY = stage.y - k * world.y;
      ty = (loY > hiY) ? (hiY + loY) / 2 : clamp(ty, loY, hiY);
    }

    /* Zoom about a point in STAGE space so that point stays put. Using k2/k
       rather than re-deriving the world point keeps this stable across long
       wheel streams. */
    function zoomAt(sx, sy, factor) {
      var k2 = clamp(k * factor, MIN_K, MAX_K);
      if (k2 === k) return false;
      tx = sx - (k2 / k) * (sx - tx);
      ty = sy - (k2 / k) * (sy - ty);
      k = k2;
      clampCam(); applyCam();
      return true;
    }
    function zoomBy(factor) {
      live(true);
      zoomAt(stage.x + stage.w / 2, stage.y + stage.h / 2, factor);
      setTimeout(function () { live(false); }, 320);
    }
    function panBy(dxPx, dyPx) {
      /* argument is in CSS pixels; convert through the current render scale */
      var r = svg.getBoundingClientRect();
      var s = r.width ? (stage.w / r.width) : 1;
      tx -= dxPx * s; ty -= dyPx * s;
      clampCam(); applyCam();
    }
    function fit() {
      live(true);
      k = MIN_K; tx = 0; ty = 0;
      clampCam(); applyCam();
      setTimeout(function () { live(false); }, 320);
    }
    function centerOn(wx, wy, wantK) {
      live(true);
      if (wantK) k = clamp(wantK, MIN_K, MAX_K);
      tx = stage.x + stage.w / 2 - k * wx;
      ty = stage.y + stage.h / 2 - k * wy;
      clampCam(); applyCam();
      setTimeout(function () { live(false); }, 420);
    }

    /* ── coordinate conversion ────────────────────────────────────────────── */
    /* getScreenCTM on the ROOT svg already folds in the viewBox scale and the
       preserveAspectRatio letterbox, so this is exact at any element size.
       Deliberately not read from the camera group: we already know k and t, and
       a CTM read forces a layout flush on every pointermove. */
    function toStage(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM();
      if (!m) return { x: e.clientX, y: e.clientY };
      return pt.matrixTransform(m.inverse());
    }
    function toWorld(e) {
      var s = toStage(e);
      return { x: (s.x - tx) / k, y: (s.y - ty) / k };
    }

    /* ── graph wiring ─────────────────────────────────────────────────────── */
    function setGraph(ns, ls, w) {
      nodes = ns; links = ls;
      if (w) { world.x = w.x; world.y = w.y; world.w = w.w; world.h = w.h; }
      idx = {};
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        idx[n.id] = n;
        n.hx = n.x; n.hy = n.y; n.vx = 0; n.vy = 0; n.el = null;
      }
      /* resolve link endpoints to node REFERENCES once, so simStep never does
         a lookup — this was a linear scan per link per frame */
      for (var j = 0; j < links.length; j++) {
        var l = links[j];
        l.a = idx[l.s]; l.b = idx[l.t];
        l.rest = (l.a && l.b) ? Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) : 0;
      }
      syncStage();
    }
    function byId(id) { return idx[id] || null; }

    /* Walk the camera layer once after every draw and cache element references.
       Without this, paint() re-queried the DOM and did a linear id scan per
       node and per edge — about 21k string comparisons a frame on the Atlas. */
    function indexElements() {
      for (var i = 0; i < nodes.length; i++) nodes[i].el = null;
      nodeEls = []; edgeEls = [];
      var g = ensureLayer();
      g.querySelectorAll('.node').forEach(function (el) {
        var n = idx[el.getAttribute('data-id')];
        if (!n) return;
        n.el = el; nodeEls.push(n);
      });
      g.querySelectorAll('.glink,.xlink,.rel').forEach(function (el) {
        var a = idx[el.getAttribute('data-s')], b = idx[el.getAttribute('data-t')];
        if (!a || !b) return;
        var cl = el.getAttribute('class') || '';
        var curv = cl.indexOf('rel') >= 0 ? CURV.rel
          : cl.indexOf('xlink') >= 0 ? CURV.xlink : CURV.glink;
        edgeEls.push({ el: el, a: a, b: b, curv: curv });
      });
    }

    function linkPath(a, b, curv) {
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
      var c = curv == null ? CURV.glink : curv;
      return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1)
        + ' Q' + (mx - dy * c).toFixed(1) + ' ' + (my + dx * c).toFixed(1)
        + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
    }

    function paint() {
      var i, n, e;
      for (i = 0; i < nodeEls.length; i++) {
        n = nodeEls[i];
        n.el.setAttribute('transform', 'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')');
      }
      for (i = 0; i < edgeEls.length; i++) {
        e = edgeEls[i];
        e.el.setAttribute('d', linkPath(e.a, e.b, e.curv));
      }
    }

    /* ── physics ──────────────────────────────────────────────────────────── */
    var SIM = { raf: null, on: !reduced };
    var dragNode = null, dragEl = null;

    /* The clamp box is the WORLD, never the camera — that separation is what
       lets the camera move without squeezing the layout. */
    function clampNode(n) {
      n.x = clamp(n.x, world.x + n.r, world.x + world.w - n.r);
      n.y = clamp(n.y, world.y + n.r, world.y + world.h - n.r);
    }
    function simStep() {
      var i, j, a, b, dx, dy, d, f, l;
      for (i = 0; i < links.length; i++) {
        l = links[i]; a = l.a; b = l.b; if (!a || !b) continue;
        dx = b.x - a.x; dy = b.y - a.y; d = Math.hypot(dx, dy) || 1;
        f = K_LINK * (d - l.rest) / d;
        if (a !== dragNode) { a.vx += dx * f; a.vy += dy * f; }
        if (b !== dragNode) { b.vx -= dx * f; b.vy -= dy * f; }
      }
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y; d = dx * dx + dy * dy;
        var min = a.r + b.r + PAD;
        if (d > min * min || d === 0) continue;
        d = Math.sqrt(d); f = K_REPEL * (1 - d / min) / (d * d);
        if (a !== dragNode) { a.vx -= dx * f * d; a.vy -= dy * f * d; }
        if (b !== dragNode) { b.vx += dx * f * d; b.vy += dy * f * d; }
      }
      var energy = 0;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i]; if (a === dragNode) continue;
        a.vx += (a.hx - a.x) * K_HOME; a.vy += (a.hy - a.y) * K_HOME;
        a.vx *= DAMP; a.vy *= DAMP;
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
      paint();
      if (dragNode || e > SLEEP) SIM.raf = requestAnimationFrame(simLoop);
      else SIM.raf = null;
    }
    function simWake() {
      if (!SIM.on) { paint(); return; }
      if (SIM.raf == null) SIM.raf = requestAnimationFrame(simLoop);
    }
    function reset() {
      if (SIM.on) {
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].vx = (nodes[i].hx - nodes[i].x) * 0.2;
          nodes[i].vy = (nodes[i].hy - nodes[i].y) * 0.2;
        }
        simWake();
      } else {
        for (var j = 0; j < nodes.length; j++) { nodes[j].x = nodes[j].hx; nodes[j].y = nodes[j].hy; }
        paint();
      }
    }

    /* ── pointer: drag, pan, pinch ────────────────────────────────────────── */
    var pts = {};              /* live pointers: id -> {x,y} client coords */
    var nPts = 0;
    var dragId = null, panId = null, pinch = null, tapId = null;
    var moved = false, downAt = null, lastPt = null, lastPrev = null;
    var lastTap = 0, lastTapPt = null;

    function pointerList() {
      var out = [], id;
      for (id in pts) if (pts.hasOwnProperty(id)) out.push(pts[id]);
      return out;
    }
    function endDrag(flick) {
      if (dragEl) dragEl.classList.remove('drag');
      if (flick && dragNode && lastPt && lastPrev && SIM.on) {
        dragNode.vx = (lastPt.x - lastPrev.x) * FLICK;
        dragNode.vy = (lastPt.y - lastPrev.y) * FLICK;
      }
      var id = dragNode ? dragNode.id : null;
      dragNode = null; dragEl = null; dragId = null;
      svg.style.cursor = '';
      if (id && opts.onDragEnd) opts.onDragEnd(id);
      simWake();
    }

    function onDown(e) {
      pts[e.pointerId] = { x: e.clientX, y: e.clientY, id: e.pointerId };
      nPts++;

      /* second finger promotes to pinch and releases whatever the first was
         doing — without the flick, since the gesture changed meaning */
      if (nPts === 2) {
        if (dragNode) endDrag(false);
        panId = null;
        var l = pointerList();
        startPinch(l[0], l[1]);
        return;
      }
      if (nPts > 2) return;

      /* every first pointer is a tap candidate, whatever it lands on — a
         background tap on touch never starts a pan (the page owns one finger),
         so without this it could never register as a tap either */
      tapId = e.pointerId;
      moved = false; downAt = { x: e.clientX, y: e.clientY };

      var nodeEl = e.target.closest ? e.target.closest('.node') : null;
      if (nodeEl) {
        var n = idx[nodeEl.getAttribute('data-id')];
        if (!n) return;
        e.preventDefault();
        try { host.setPointerCapture(e.pointerId); } catch (err) {}
        dragId = e.pointerId; dragNode = n; dragEl = nodeEl;
        lastPt = { x: n.x, y: n.y }; lastPrev = lastPt;
        nodeEl.classList.remove('hover'); nodeEl.classList.add('drag');
        svg.style.cursor = 'grabbing';
        if (opts.onDragStart) opts.onDragStart(n.id);
        simWake();
        return;
      }

      /* Background. On touch, one finger belongs to the page — that is what
         keeps the graph from being a scroll trap. In expand mode there is no
         page behind it, so one finger pans. */
      if (e.pointerType === 'touch' && !expanded) return;
      e.preventDefault();
      try { host.setPointerCapture(e.pointerId); } catch (err2) {}
      panId = e.pointerId;
      svg.style.cursor = 'grabbing';
    }

    function onMove(e) {
      if (pts[e.pointerId]) { pts[e.pointerId].x = e.clientX; pts[e.pointerId].y = e.clientY; }

      if (pinch) { movePinch(); return; }

      if (downAt && !moved) {
        var dd = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        if (dd > TAP_SLOP) moved = true;
      }

      if (dragId === e.pointerId && dragNode) {
        var p = toWorld(e);
        lastPrev = lastPt; lastPt = { x: p.x, y: p.y };
        dragNode.x = p.x; dragNode.y = p.y; clampNode(dragNode);
        dragNode.vx = 0; dragNode.vy = 0;
        /* one synchronous step so the grabbed node tracks 1:1 and its
           neighbours give way in the same frame; the rAF loop keeps relaxing */
        if (SIM.on) simStep();
        paint();
        simWake();
        return;
      }
      if (panId === e.pointerId) {
        var r = svg.getBoundingClientRect();
        var s = r.width ? (stage.w / r.width) : 1;
        tx += e.movementX != null ? e.movementX * s : 0;
        ty += e.movementY != null ? e.movementY * s : 0;
        clampCam(); applyCam();
      }
    }

    function onUp(e) {
      var wasTap = !moved && tapId === e.pointerId && !pinch;
      var tapNode = dragNode;

      if (pinch && (e.pointerId === pinch.i1 || e.pointerId === pinch.i2)) pinch = null;
      if (dragId === e.pointerId) endDrag(true);
      if (panId === e.pointerId) { panId = null; svg.style.cursor = ''; }
      if (tapId === e.pointerId) tapId = null;

      delete pts[e.pointerId]; nPts = Math.max(0, nPts - 1);
      if (nPts === 0) { downAt = null; live(false); }

      if (wasTap) {
        engage(true);
        /* double-tap / double-click, hand-rolled so mouse and touch share one
           path and neither depends on dblclick firing under touch-action */
        var now = e.timeStamp || Date.now();
        if (lastTapPt && (now - lastTap) < DBL_MS
            && Math.hypot(e.clientX - lastTapPt.x, e.clientY - lastTapPt.y) < DBL_SLOP) {
          var s = toStage(e);
          live(true);
          zoomAt(s.x, s.y, e.shiftKey ? 0.5 : 2);
          setTimeout(function () { live(false); }, 320);
          lastTap = 0; lastTapPt = null;
        } else {
          lastTap = now; lastTapPt = { x: e.clientX, y: e.clientY };
        }
        if (tapNode && opts.onTap) opts.onTap(tapNode.id);
        else if (!tapNode && opts.onBgTap) opts.onBgTap();
      }
    }

    /* An OS gesture takeover (iOS back-swipe, an incoming call) fires this and
       not pointerup. Without it the node stayed glued to the finger and the
       rAF loop span forever. */
    function onCancel(e) {
      if (pinch && (e.pointerId === pinch.i1 || e.pointerId === pinch.i2)) pinch = null;
      if (dragId === e.pointerId) endDrag(false);
      if (panId === e.pointerId) { panId = null; svg.style.cursor = ''; }
      if (tapId === e.pointerId) tapId = null;
      delete pts[e.pointerId]; nPts = Math.max(0, nPts - 1);
      if (nPts === 0) { downAt = null; live(false); }
    }

    /* Absolute pinch: anchoring on the world point under the initial midpoint
       gives zoom AND two-finger pan out of the same two lines. */
    function startPinch(p1, p2) {
      var mid = { clientX: (p1.x + p2.x) / 2, clientY: (p1.y + p2.y) / 2 };
      var s0 = toStage(mid);
      pinch = {
        i1: p1.id, i2: p2.id,
        d0: Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y)),
        k0: k,
        w0: { x: (s0.x - tx) / k, y: (s0.y - ty) / k }
      };
      moved = true;
      live(false);
      engage(true);
    }
    function movePinch() {
      var p1 = pts[pinch.i1], p2 = pts[pinch.i2];
      if (!p1 || !p2) { pinch = null; return; }
      var d = Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y));
      var mid = { clientX: (p1.x + p2.x) / 2, clientY: (p1.y + p2.y) / 2 };
      var s = toStage(mid);
      k = clamp(pinch.k0 * (d / pinch.d0), MIN_K, MAX_K);
      tx = s.x - k * pinch.w0.x;
      ty = s.y - k * pinch.w0.y;
      clampCam(); applyCam();
    }

    /* ── wheel ────────────────────────────────────────────────────────────── */
    function onWheel(e) {
      if (e.target.closest && e.target.closest('.detail')) return;  /* card scrolls */
      /* macOS trackpad pinch arrives as a wheel with ctrlKey — always ours, and
         it must be prevented or the browser page-zooms. A plain wheel is only
         ours once the map has been engaged by a click; otherwise it is never
         prevented and the page scrolls exactly as before. */
      var pinchGesture = e.ctrlKey || e.metaKey;
      if (!pinchGesture && !engaged) return;
      e.preventDefault();
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;            /* Firefox reports lines */
      else if (e.deltaMode === 2) dy *= 400;      /* pages */
      dy = clamp(dy, -60, 60);                    /* one flick must not blow the range */
      live(false);
      var s = toStage(e);
      zoomAt(s.x, s.y, Math.exp(-dy * WHEEL_RATE));
    }

    /* Safari reports trackpad pinch as gesture events rather than ctrl+wheel */
    var gK0 = 1;
    function onGestureStart(e) { e.preventDefault(); gK0 = k; live(false); }
    function onGestureChange(e) {
      e.preventDefault();
      var s = toStage(e);
      var want = clamp(gK0 * e.scale, MIN_K, MAX_K);
      if (want !== k) zoomAt(s.x, s.y, want / k);
    }

    /* ── engage: what a plain wheel means ─────────────────────────────────── */
    /* Click-to-engage keeps the graph from hijacking page scroll. It reads as
       inert only if the state is invisible, so the host gets a class and the
       hint text swaps — and because clicking a node is the primary interaction
       anyway, most people engage without ever thinking about it. */
    function engage(on) {
      if (engaged === on) return;
      engaged = on;
      host.classList.toggle('engaged', on);
      if (opts.onEngage) opts.onEngage(on);
    }

    /* ── keyboard ─────────────────────────────────────────────────────────── */
    function onKey(e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var step = e.shiftKey ? 200 : 40;
      /* Arrows stay spatial in RTL: ArrowRight always moves the viewport right.
         Mirroring is a list convention, not a map one. */
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.4); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(1 / 1.4); }
      else if (e.key === '0') { e.preventDefault(); fit(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); panBy(step, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); panBy(-step, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); panBy(0, step); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); panBy(0, -step); }
    }

    /* ── control cluster ──────────────────────────────────────────────────── */
    var els = {};
    function buildControls() {
      var box = document.createElement('div');
      box.className = 'gzoom';
      box.innerHTML =
        '<button type="button" data-z="in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></button>'
        + '<button type="button" data-z="out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12h12"/></svg></button>'
        + '<button type="button" data-z="fit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg></button>'
        + '<button type="button" data-z="exp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>';
      host.appendChild(box);
      box.querySelectorAll('button').forEach(function (b) {
        els[b.getAttribute('data-z')] = b;
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var z = b.getAttribute('data-z');
          if (z === 'in') zoomBy(1.4);
          else if (z === 'out') zoomBy(1 / 1.4);
          else if (z === 'fit') fit();
          else toggleExpand();
          engage(true);
        });
      });
      syncButtons();
    }
    function syncButtons() {
      if (els.in) els.in.disabled = k >= MAX_K - 0.001;
      if (els.out) els.out.disabled = k <= MIN_K + 0.001;
      if (els.fit) els.fit.disabled = k <= MIN_K + 0.001;
    }
    function setStrings(s) {
      S = s || S;
      if (els.in) els.in.setAttribute('aria-label', S.zoomIn || 'Zoom in');
      if (els.out) els.out.setAttribute('aria-label', S.zoomOut || 'Zoom out');
      if (els.fit) els.fit.setAttribute('aria-label', S.fit || 'Fit');
      if (els.exp) els.exp.setAttribute('aria-label', (expanded ? S.collapse : S.expand) || 'Expand');
      if (els.in) els.in.title = S.zoomIn || '';
      if (els.out) els.out.title = S.zoomOut || '';
      if (els.fit) els.fit.title = S.fit || '';
      if (els.exp) els.exp.title = (expanded ? S.collapse : S.expand) || '';
    }

    /* ── expand ───────────────────────────────────────────────────────────── */
    function toggleExpand(force) {
      expanded = force == null ? !expanded : !!force;
      host.classList.toggle('expanded', expanded);
      document.documentElement.classList.toggle('graph-expanded', expanded);
      setStrings(S);
      /* the element changed size, so the stage aspect has to follow */
      setTimeout(function () { syncStage(); if (opts.onExpand) opts.onExpand(expanded); }, 0);
    }

    /* ── binding ──────────────────────────────────────────────────────────── */
    var ro = null;
    function bind() {
      ensureLayer();
      host.addEventListener('pointerdown', onDown);
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerup', onUp);
      host.addEventListener('pointercancel', onCancel);
      host.addEventListener('lostpointercapture', onCancel);
      host.addEventListener('wheel', onWheel, { passive: false });
      if ('ongesturestart' in window) {
        host.addEventListener('gesturestart', onGestureStart);
        host.addEventListener('gesturechange', onGestureChange);
        host.addEventListener('gestureend', function (e) { e.preventDefault(); });
      }
      svg.addEventListener('keydown', onKey);
      document.addEventListener('pointerdown', function (e) {
        if (!host.contains(e.target)) engage(false);
      }, true);
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (expanded) { toggleExpand(false); return; }
        engage(false);
      });
      buildControls();
      setStrings(S);
      if (window.ResizeObserver) {
        var lastA = 0;
        ro = new ResizeObserver(function () {
          var r = svg.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var a = r.width / r.height;
          /* only when the aspect actually moves — an iOS URL-bar collapse
             mid-scroll would otherwise jolt the map */
          if (Math.abs(a - lastA) / (lastA || 1) < 0.01) return;
          lastA = a;
          syncStage();
        });
        ro.observe(svg);
      } else {
        window.addEventListener('resize', syncStage);
      }
    }

    var G = {
      layer: null,
      bind: bind,
      setGraph: setGraph,
      byId: byId,
      indexElements: function () { indexElements(); G.layer = ensureLayer(); },
      paint: paint,
      step: simStep,
      wake: simWake,
      reset: reset,
      fit: fit,
      zoomBy: zoomBy,
      panBy: panBy,
      centerOn: centerOn,
      linkPath: linkPath,
      toStage: toStage,
      toWorld: toWorld,
      syncStage: syncStage,
      setStrings: setStrings,
      toggleExpand: toggleExpand,
      isExpanded: function () { return expanded; },
      isEngaged: function () { return engaged; },
      didMove: function () { return moved; },
      isDragging: function () { return !!dragNode; },
      getCamera: function () { return { k: k, tx: tx, ty: ty, stage: stage, world: world }; },
      reduced: reduced,
      simOn: function () { return SIM.on; }
    };
    G.layer = ensureLayer();
    return G;
  }

  window.GraphCamera = { create: create };
})();
