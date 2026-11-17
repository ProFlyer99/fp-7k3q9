/* fp_wxc.js v1.3 (17 NOV 26) - + view(list, i, key): the same full-screen viewer with pen for other pictures (icing worksheet, HOT tables).
   v1.2 (16 NOV 26) - + chart names (read from the chart by Claude), overview grid, eraser.
   v1.1 - + finger drawing (pens / highlighter) on the charts, kept per flight on this iPad.
   v1.0 - WX·NOTAM: "OFP weather charts" tab (pilot request 16 NOV 26).
   Every picture page of the OFP (Lido SWC / SIGWX / cross-section / wind charts and the satellite pictures), in OFP order.
   The charts come in Claude's flight files (data.wxcharts = [{page, w, h, src}]) - never in the public app code.
   Tap a chart = full screen: pinch / double-tap to zoom, drag to pan, ‹ › or swipe for the next chart. */
window.FPWxc = (function () {
  'use strict';
  var C = [], cur = 'main', ov = null, idx = 0, mode = 'grid', NS = 'http://www.w3.org/2000/svg', DK = 'fp.wxd.x', DR = {};
  var draw = false, tool = 'red', TOOLS = { red: { c: '#e5262d', w: 4, o: 1 }, blue: { c: '#1f5fd6', w: 4, o: 1 }, hl: { c: '#ffd400', w: 24, o: .38 }, er: { c: '#000', w: 1, o: 0 } }, clrArm = false;
  function loadD() { try { DR = JSON.parse(localStorage.getItem(DK) || '{}') || {}; } catch (e) { DR = {}; } }
  function saveD() { try { localStorage.setItem(DK, JSON.stringify(DR)); } catch (e) { } }
  var V = [], VD = {}, VK = '';
  function saveV() { try { localStorage.setItem(VK, JSON.stringify(VD)); } catch (e) { } if (VD === DR) DR = VD; }
  function tt(c) { return c.title || 'Weather chart'; }
  function pathD(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(''); }
  function strokeEl(st) { var e = document.createElementNS(NS, 'path'), T = TOOLS[st.t] || TOOLS.red; e.setAttribute('d', pathD(st.p)); e.setAttribute('fill', 'none'); e.setAttribute('stroke', T.c);
    e.setAttribute('stroke-width', T.w); e.setAttribute('stroke-opacity', T.o); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); if (st.t === 'hl') e.setAttribute('style', 'mix-blend-mode:multiply'); return e; }
  function paintSvg(svg, c, dd) { svg.setAttribute('viewBox', '0 0 ' + (c.w || 1200) + ' ' + (c.h || 860)); while (svg.firstChild) svg.removeChild(svg.firstChild); ((dd || DR)[c.page] || []).forEach(function (st) { svg.appendChild(strokeEl(st)); }); }
  function mkSvg() { var v = document.createElementNS(NS, 'svg'); v.setAttribute('class', 'wxc-ink'); v.setAttribute('preserveAspectRatio', 'xMidYMid meet'); return v; }
  function paintList() { C.forEach(function (c, i) { var f = $('wxc-' + i); if (!f) return; var v = f.querySelector('svg.wxc-ink'); if (!v) { var w = f.querySelector('.wxc-iw'); v = mkSvg(); w.appendChild(v); } paintSvg(v, c);
      var has = !!(DR[c.page] && DR[c.page].length), j = document.querySelector('[data-wj="' + i + '"]'); if (j) j.classList.toggle('ink', has);
      var g = document.querySelector('[data-wi2="' + i + '"]'); if (g) { g.classList.toggle('ink', has); g.querySelector('.wxc-inkb').hidden = !has;
        var th = g.querySelector('.wxc-th'), gv = th.querySelector('svg.wxc-ink'); if (!gv) { gv = mkSvg(); th.appendChild(gv); } paintSvg(gv, c); } }); }
  function $(id) { return document.getElementById(id); }
  function init(D) {
    C = (D && D.wxcharts && D.wxcharts.length) ? D.wxcharts : [];
    DK = 'fp.wxd.' + ((window.FPRec && window.FPRec.id) || 'x'); loadD();
    var sec = $('v-wxnotam'); if (!C.length || !sec || sec.querySelector(':scope > .brf-tabs')) return;
    var main = document.createElement('div'); main.className = 'brf-card wxc-main';
    while (sec.firstChild) main.appendChild(sec.firstChild);
    var tabs = document.createElement('div'); tabs.className = 'gtabs brf-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" role="tab" data-wt="main">Weather &amp; NOTAM</button><button type="button" role="tab" data-wt="charts">OFP weather charts (' + C.length + ')</button>';
    var pg = document.createElement('div'); pg.className = 'wxc-page'; pg.hidden = true;
    pg.innerHTML = '<div class="bar"><span>OFP weather charts · in OFP order</span><small>' + C.length + ' pages from the OFP · tap a chart for full screen and zoom</small></div>' +
      '<div class="wxc-mode"><button type="button" data-wm="grid">▦ Overview</button><button type="button" data-wm="list">☰ Full size</button></div>' +
      '<div class="wxc-grid">' + C.map(function (c, i) { return '<button type="button" class="wxc-card" data-wi2="' + i + '"><span class="wxc-th"><img loading="lazy" decoding="async" src="' + c.src + '" alt=""></span>' +
        '<b>' + (i + 1) + ' · ' + tt(c) + '</b><small>OFP page ' + c.page + '<i class="wxc-inkb" hidden> · ✎ marked</i></small></button>'; }).join('') + '</div>' +
      '<div class="wxc-list">' +
      '<div class="wxc-jump">' + C.map(function (c, i) { return '<button type="button" data-wj="' + i + '" title="' + tt(c) + '">' + (i + 1) + '<small>p' + c.page + '</small></button>'; }).join('') + '</div>' +
      C.map(function (c, i) { return '<figure class="wxc-fig" id="wxc-' + i + '"><figcaption>' + (i + 1) + ' / ' + C.length + ' · ' + tt(c) + ' · OFP page ' + c.page + '</figcaption>' +
        '<div class="wxc-iw"><img loading="lazy" decoding="async" src="' + c.src + '" width="' + (c.w || 1200) + '" height="' + (c.h || 860) + '" alt="' + tt(c) + ', OFP page ' + c.page + '" data-wi="' + i + '"></div></figure>'; }).join('') + '</div>';
    sec.appendChild(tabs); sec.appendChild(main); sec.appendChild(pg); paintList();
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-wt]'); if (b) show(b.dataset.wt); });
    pg.addEventListener('click', function (e) {
      var j = e.target.closest('[data-wj]'); if (j) { var f = $('wxc-' + j.dataset.wj); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      var im = e.target.closest('.wxc-iw'); if (im) { open(+im.querySelector('img').dataset.wi); return; }
      var cd = e.target.closest('[data-wi2]'); if (cd) { open(+cd.dataset.wi2); return; }
      var md = e.target.closest('[data-wm]'); if (md) setMode(md.dataset.wm);
    });
    try { mode = localStorage.getItem('fp.wxc.mode') || 'grid'; } catch (e) { } setMode(mode); show(cur);
  }
  function setMode(m) { mode = m === 'list' ? 'list' : 'grid'; var p = document.querySelector('#v-wxnotam .wxc-page'); if (!p) return;
    p.classList.toggle('as-grid', mode === 'grid'); p.querySelectorAll('[data-wm]').forEach(function (b) { b.classList.toggle('on', b.dataset.wm === mode); });
    try { localStorage.setItem('fp.wxc.mode', mode); } catch (e) { } }
  function show(t) {
    var sec = $('v-wxnotam'); if (!sec) return; cur = t;
    var m = sec.querySelector(':scope > .wxc-main'), p = sec.querySelector(':scope > .wxc-page'); if (!m || !p) return;
    m.hidden = t === 'charts'; p.hidden = t !== 'charts';
    sec.querySelectorAll(':scope > .brf-tabs [data-wt]').forEach(function (b) { var o = b.dataset.wt === t; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
    window.scrollTo(0, 0);
  }
  /* ---------- full-screen viewer */
  var erasing = false, s = 1, tx = 0, ty = 0, ptr = {}, start = null, lastTap = 0, img = null, vp = null, stage = null, ink = null, live = null, liveEl = null;
  function ensure() {
    if (ov) return;
    ov = document.createElement('div'); ov.className = 'wxc-ov'; ov.hidden = true; ov.setAttribute('role', 'dialog');
    ov.innerHTML = '<div class="wxc-top"><b class="wxc-t"></b><button type="button" class="wxc-dr" data-wv="draw" aria-pressed="false">✎ Draw</button>' +
      '<span class="wxc-tools" hidden><button type="button" data-wt2="red" aria-label="Red pen"><i style="background:#e5262d"></i>Pen</button><button type="button" data-wt2="blue" aria-label="Blue pen"><i style="background:#1f5fd6"></i>Pen</button>' +
      '<button type="button" data-wt2="hl" aria-label="Highlighter"><i style="background:#ffd400"></i>Highlight</button><button type="button" data-wt2="er" aria-label="Eraser - touch a mark to remove it">⌫ Eraser</button><button type="button" data-wv="undo">Undo</button><button type="button" data-wv="clear">Clear</button></span>' +
      '<button type="button" data-wv="fit">Fit</button><button type="button" data-wv="x" aria-label="Close">×</button></div>' +
      '<div class="wxc-vp"><div class="wxc-stage"><img alt=""></div></div><button type="button" class="wxc-nav wxc-prev" data-wv="prev" aria-label="Previous chart">‹</button><button type="button" class="wxc-nav wxc-next" data-wv="next" aria-label="Next chart">›</button>';
    document.body.appendChild(ov); vp = ov.querySelector('.wxc-vp'); stage = vp.querySelector('.wxc-stage'); img = stage.querySelector('img'); ink = mkSvg(); stage.appendChild(ink);
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-wv]'); if (!b) return; var a = b.dataset.wv;
      if (a === 'x') close(); else if (a === 'fit') fit(); else if (a === 'prev') go(idx - 1); else if (a === 'next') go(idx + 1);
      else if (a === 'draw') setDraw(!draw);
      else if (a === 'undo') { var L = VD[V[idx].page]; if (L && L.length) { L.pop(); if (!L.length) delete VD[V[idx].page]; saveV(); paintSvg(ink, V[idx], VD); } }
      else if (a === 'clear') { if (!clrArm) { clrArm = true; b.textContent = 'Clear all?'; b.classList.add('arm'); setTimeout(function () { clrArm = false; b.textContent = 'Clear'; b.classList.remove('arm'); }, 3000); }
        else { delete VD[V[idx].page]; saveV(); paintSvg(ink, V[idx], VD); clrArm = false; b.textContent = 'Clear'; b.classList.remove('arm'); } } });
    ov.querySelector('.wxc-tools').addEventListener('click', function (e) { var b = e.target.closest('[data-wt2]'); if (b) { tool = b.dataset.wt2; markTool(); } });
    vp.addEventListener('pointerdown', function (e) { vp.setPointerCapture(e.pointerId); ptr[e.pointerId] = [e.clientX, e.clientY]; start = snap(); e.preventDefault();
      var n = Object.keys(ptr).length;
      if (draw && n === 1 && tool === 'er') { erasing = true; eraseAt(toImg(e)); }
      else if (draw && n === 1) { live = { t: tool, p: [toImg(e)] }; liveEl = strokeEl(live); ink.appendChild(liveEl); }
      else if (live && n >= 2) { if (liveEl) liveEl.remove(); live = liveEl = null; }   // second finger = pinch, not ink
    });
    vp.addEventListener('pointermove', function (e) {
      if (!ptr[e.pointerId]) return; ptr[e.pointerId] = [e.clientX, e.clientY]; var k = Object.keys(ptr);
      if (erasing && k.length === 1) { eraseAt(toImg(e)); return; }
      if (live && k.length === 1) { var q = toImg(e), l = live.p[live.p.length - 1]; if (Math.abs(q[0] - l[0]) + Math.abs(q[1] - l[1]) > 1.2 / s) { live.p.push(q); liveEl.setAttribute('d', pathD(live.p)); } return; }
      if (k.length === 1 && start && start.n === 1) { tx = start.tx + (e.clientX - start.p[0][0]); ty = start.ty + (e.clientY - start.p[0][1]); apply(); }
      else if (k.length >= 2 && start && start.n >= 2) { var a = ptr[k[0]], b = ptr[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        var ns = Math.max(1, Math.min(8, start.s * d / start.d)), r = vp.getBoundingClientRect(), cx = c[0] - r.left, cy = c[1] - r.top;
        tx = cx - (start.cx - start.tx) * ns / start.s; ty = cy - (start.cy - start.ty) * ns / start.s; s = ns; apply(); }
    });
    function up(e) {
      if (erasing) { erasing = false; delete ptr[e.pointerId]; start = null; return; }
      if (live) { if (live.p.length === 1) live.p.push([live.p[0][0] + .5, live.p[0][1] + .5]); var pgk = V[idx].page; (VD[pgk] = VD[pgk] || []).push(live); saveV(); live = liveEl = null; delete ptr[e.pointerId]; start = null; return; }
      var was = start; delete ptr[e.pointerId]; start = Object.keys(ptr).length ? snap() : null;
      if (draw && was && was.n === 1) { limits(); return; }   // no swipe / double-tap while drawing
      if (was && was.n === 1 && !start) {
        var dx = e.clientX - was.p[0][0], dy = e.clientY - was.p[0][1];
        if (s <= 1.02 && Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) { go(idx + (dx < 0 ? 1 : -1)); return; }   // swipe = next / previous chart
        if (Math.abs(dx) + Math.abs(dy) < 8) { var now = Date.now(); if (now - lastTap < 320) { var r = vp.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top, ns = s > 1.5 ? 1 : 3;
          tx = cx - (cx - tx) * ns / s; ty = cy - (cy - ty) * ns / s; s = ns; if (s === 1) { tx = 0; ty = 0; } apply(true); lastTap = 0; } else lastTap = now; }
      }
      limits();
    }
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    document.addEventListener('keydown', function (e) { if (ov.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1); });
  }
  function snap() { var k = Object.keys(ptr), p = k.map(function (i) { return ptr[i]; }), r = vp.getBoundingClientRect(), o = { n: k.length, p: p, s: s, tx: tx, ty: ty };
    if (k.length >= 2) { o.d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1; o.cx = (p[0][0] + p[1][0]) / 2 - r.left; o.cy = (p[0][1] + p[1][1]) / 2 - r.top; } return o; }
  function apply(anim) { stage.style.transition = anim ? 'transform .2s ease' : 'none'; stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'; }
  function limits() { var W = vp.clientWidth, H = vp.clientHeight, w = stage.offsetWidth * s, h = stage.offsetHeight * s;
    var minx = Math.min(0, W - w), miny = Math.min(0, H - h); if (s <= 1) { tx = 0; ty = 0; } else { tx = Math.max(minx, Math.min(0, tx)); ty = Math.max(miny, Math.min(0, ty)); } apply(true); }
  function fit() { s = 1; tx = 0; ty = 0; apply(true); }
  function toImg(e) { var m = ink.getScreenCTM(); if (!m) return [0, 0]; var pt = ink.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var r = pt.matrixTransform(m.inverse()); return [r.x, r.y]; }
  function eraseAt(q) {   // remove every mark that passes within ~14 screen px of the finger
    var L = VD[V[idx].page]; if (!L || !L.length) return; var m = ink.getScreenCTM(), tol = 14 / ((m && m.a) || 1), n0 = L.length;   // 14 screen px in chart units
    VD[V[idx].page] = L.filter(function (st) { var T = TOOLS[st.t] || TOOLS.red, tl = tol + T.w / 2;
      for (var i = 0; i < st.p.length; i++) { var a = st.p[i], b = st.p[i + 1] || a, dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L2)) : 0;
        if (Math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy)) <= tl) return false; } return true; });
    if (!VD[V[idx].page].length) delete VD[V[idx].page]; if ((VD[V[idx].page] || []).length !== n0) { saveV(); paintSvg(ink, V[idx], VD); } }
  function markTool() { ov.querySelectorAll('[data-wt2]').forEach(function (b) { var o = b.dataset.wt2 === tool; b.classList.toggle('on', o); b.setAttribute('aria-pressed', o ? 'true' : 'false'); }); }
  function setDraw(on) { draw = on; var b = ov.querySelector('.wxc-dr'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '✎ Drawing' : '✎ Draw';
    ov.querySelector('.wxc-tools').hidden = !on; ov.classList.toggle('drawing', on); markTool(); }
  function go(i) { if (i < 0 || i >= V.length) return; idx = i; img.src = V[i].src; paintSvg(ink, V[i], VD); ov.querySelector('.wxc-t').textContent = V === C ? (i + 1) + ' / ' + C.length + ' · ' + tt(C[i]) + ' · p' + C[i].page : (V.length > 1 ? (i + 1) + ' / ' + V.length + ' · ' : '') + tt(V[i]);
    ov.querySelector('.wxc-prev').disabled = i === 0; ov.querySelector('.wxc-next').disabled = i === V.length - 1; ov.classList.toggle('single', V.length < 2); fit(); }
  function open(i) { V = C; VD = DR; VK = DK; ensure(); ov.hidden = false; document.documentElement.classList.add('wxc-lock'); go(i); }
  function view(list, i, key) { V = list || []; VK = key || 'fp.wxd.view'; try { VD = JSON.parse(localStorage.getItem(VK) || '{}') || {}; } catch (e) { VD = {}; } ensure(); ov.hidden = false; document.documentElement.classList.add('wxc-lock'); go(i || 0); }
  function close() { if (!ov) return; ov.hidden = true; setDraw(false); if (V !== C) { document.documentElement.classList.remove('wxc-lock'); return; } paintList(); document.documentElement.classList.remove('wxc-lock'); var f = mode === 'grid' ? document.querySelector('[data-wi2="' + idx + '"]') : $('wxc-' + idx); if (f) f.scrollIntoView({ block: 'center' }); }
  return { init: init, show: show, open: open, view: view };
})();
