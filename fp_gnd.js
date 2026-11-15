/* fp_gnd.js v1.2 (16 NOV 26) - GND (ground phase) area, pilot request 16 NOV 26:
   page 1 = Checklist: the pilot's own cockpit flow cards (tick each item, Mark complete; edit / add / delete cards),
   page 2 = OTP: the on-time performance STD timeline (fp_turn.js, from the flight file).
   The default cards are the pilot's own list (from his photo). Edited cards are kept on this iPad for every flight;
   ticks are kept per flight. */
window.FPGnd = (function () {
  'use strict';
  var DEF = [
    { id: 'prelim', t: 'PRELIMINARY COCKPIT PREPARATION', i: ['AIRCRAFT SETUP', 'BATTERIES CHECK / EXTERNAL POWER', 'ELM', 'ADIRS', 'COCKPIT LIGHTS', 'EFB / FMS INITIALIZATION', 'ANF', 'AIRCRAFT ACCEPTANCE', 'FIRE TEST / APU START', 'OIS PREP & PERF PRELIM', 'BEFORE WALK AROUND ECAM PAGES'] },
    { id: 'cockpit', t: 'COCKPIT PREPARATION', i: ['OVERHEAD PANEL', 'CENTER INSTRUMENT PANEL', 'PEDESTAL', 'MFD ATC COM', 'MFD SURV', 'MFD FMS PREPARATION', 'GLARESHIELD', 'LATERAL CONSOLES', 'PF & PM INSTRUMENT PANELS', 'FUEL ON BOARD', 'DEPARTURE BRIEFING', 'COCKPIT PREPARATION CHECKLIST'] },
    { id: 'push', t: 'BEFORE PUSH BACK / START CLEARANCE', i: ['LOADSHEET', 'TAKE OFF DATA', 'SEATING POSITION', 'AIR CONDITIONING UNITS', 'EXTERNAL POWER'] }
  ];
  var LK = 'fp.gnd.lists', el = null, tabsEl = null, chk = null, otp = null, fid = 'x', st = null, L = null, edit = -1, delArm = -1, delT = null, curTab = 'chk';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function zz(ms) { var d = new Date(ms); return pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + 'Z'; }
  function toast(t, undo) { var C = window.FPCore; if (C && C.toast) C.toast(t, undo); }
  function loadL() { try { L = JSON.parse(localStorage.getItem(LK) || 'null'); } catch (e) { L = null; } var nw = !Array.isArray(L); if (nw) L = JSON.parse(JSON.stringify(DEF)); L.forEach(function (c) { if (!c.id) { c.id = 'c' + Math.random().toString(36).slice(2, 8); nw = true; } }); if (nw) saveL(); }   // v1.1: fixed ids, saved at once, so ticks survive a reload
  function saveL() { try { localStorage.setItem(LK, JSON.stringify(L)); } catch (e) { } }
  function loadS() { try { st = JSON.parse(localStorage.getItem('fp.gnd.' + fid) || 'null'); } catch (e) { st = null; } st = st || {}; st.tk = st.tk || {}; st.done = st.done || {}; }
  function saveS() { try { localStorage.setItem('fp.gnd.' + fid, JSON.stringify(st)); } catch (e) { } }
  function key(c, it) { return c.id + '|' + it; }   // ticks follow the item text, so editing a card keeps the ticks of unchanged items
  function cnt(c) { var n = 0; c.i.forEach(function (it) { if (st.tk[key(c, it)]) n++; }); return n; }

  function cardHtml(c, k, pop) {
    var n = cnt(c), tot = c.i.length, done = st.done[c.id] || (tot && n === tot ? 1 : 0);
    if (edit === k && !pop) {
      return '<div class="gcard gedit" data-k="' + k + '"><label>Title<input class="gti" maxlength="60" value="' + esc(c.t) + '"></label>' +
        '<label>Items – one per line<textarea class="gta" rows="' + Math.max(6, c.i.length + 1) + '">' + esc(c.i.join('\n')) + '</textarea></label>' +
        '<div class="gbar"><button type="button" class="pri" data-g="save" data-k="' + k + '">Save</button><button type="button" data-g="cancel">Cancel</button></div></div>';
    }
    return '<div class="gcard' + (done ? ' gdone' : '') + '" data-k="' + k + '"><div class="gch"><span class="gpr">' + n + ' / ' + tot + '</span>' +
      (pop ? '' : '<button type="button" class="gic" data-g="edit" data-k="' + k + '" aria-label="Edit ' + esc(c.t) + '">✎</button>' +
      '<button type="button" class="gic' + (delArm === k ? ' garm' : '') + '" data-g="del" data-k="' + k + '" aria-label="Delete ' + esc(c.t) + '">' + (delArm === k ? 'Delete?' : '🗑') + '</button>') + '</div>' +
      '<h3>' + esc(c.t) + '</h3><div class="gbarp"><i style="width:' + (tot ? Math.round(n / tot * 100) : 0) + '%"></i></div><ul>' +
      c.i.map(function (it, j) { var t = st.tk[key(c, it)], nx = pop && !t && !c.i.slice(0, j).some(function (x) { return !st.tk[key(c, x)]; }); return '<li><button type="button" class="gbox' + (t ? ' on' : '') + (nx ? ' gnext' : '') + '" data-g="tick" data-k="' + k + '" data-j="' + j + '" aria-pressed="' + (t ? 'true' : 'false') + '"><span class="gsq">' + (t ? '✓' : '') + '</span><span class="gtx">' + esc(it) + '</span>' + (t ? '<small>' + zz(t) + '</small>' : '') + '</button></li>'; }).join('') + '</ul>' +
      (done ? '<div class="gfin">✓ Complete' + (typeof st.done[c.id] === 'number' && st.done[c.id] > 1 ? ' · ' + zz(st.done[c.id]) : '') + ' <button type="button" data-g="reopen" data-k="' + k + '">Reset card</button></div>'
        : '<button type="button" class="gmc" data-g="all" data-k="' + k + '">✓ Mark complete</button>') + '</div>';
  }
  function renderChk() {
    if (!chk) return;
    var all = 0, tick = 0; L.forEach(function (c) { all += c.i.length; tick += cnt(c); });
    chk.innerHTML = '<div class="bar"><span>Ground phase · cockpit flow</span><small>' + tick + ' of ' + all + ' items ticked · ticks kept for this flight on this iPad</small></div>' +
      '<div class="ggrid">' + L.map(function (c, k) { return cardHtml(c, k, false); }).join('') + '</div>' +
      '<div class="gfoot"><button type="button" data-g="add">+ New card</button><button type="button" data-g="clear">Clear all ticks (new sector)</button><button type="button" data-g="def">Restore my default cards</button></div>';
  }
  function tab(t) {
    curTab = t === 'otp' && otp ? 'otp' : 'chk';
    if (chk) chk.hidden = curTab !== 'chk'; if (otp) otp.hidden = curTab !== 'otp';
    if (tabsEl) tabsEl.querySelectorAll('[data-gt]').forEach(function (b) { var o = b.dataset.gt === curTab; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
    try { sessionStorage.setItem('fp.gnd.tab', curTab); } catch (e) { }
  }
  function act(ev) {
    var b = ev.target.closest('[data-g]'); if (!b) return; var g = b.dataset.g, k = +b.dataset.k, c = L[k];
    if (g !== 'del') { delArm = -1; }
    if (g === 'tick' && c) {
      var it = c.i[+b.dataset.j], kk = key(c, it);
      if (st.tk[kk]) { delete st.tk[kk]; delete st.done[c.id]; } else { st.tk[kk] = Date.now(); if (cnt(c) === c.i.length) { st.done[c.id] = Date.now(); toast(c.t + ' – complete.'); advance(k); } }
      saveS();
    } else if (g === 'all' && c) {
      var prev = JSON.stringify(st), t = Date.now(); c.i.forEach(function (it) { if (!st.tk[key(c, it)]) st.tk[key(c, it)] = t; }); st.done[c.id] = t; saveS(); advance(k);
      toast(c.t + ' – marked complete.', function () { st = JSON.parse(prev); saveS(); renderChk(); renderPop(); paintExt(); });
    } else if (g === 'reopen' && c) {
      var pv = JSON.stringify(st); c.i.forEach(function (it) { delete st.tk[key(c, it)]; }); delete st.done[c.id]; saveS();
      toast(c.t + ' – reset.', function () { st = JSON.parse(pv); saveS(); renderChk(); renderPop(); paintExt(); });
    } else if (g === 'edit') { edit = k; }
    else if (g === 'cancel') { if (L[edit] && L[edit].nw && !L[edit].i.length) L.splice(edit, 1); edit = -1; }
    else if (g === 'save') {
      var box = b.closest('.gcard'), ti = box.querySelector('.gti').value.trim(), items = box.querySelector('.gta').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!ti) { toast('Give the card a title.'); return; }
      c.t = ti; c.i = items; delete c.nw; edit = -1; saveL();
    } else if (g === 'del' && c) {
      if (delArm !== k) { delArm = k; clearTimeout(delT); delT = setTimeout(function () { delArm = -1; renderChk(); }, 4000); }
      else { var bak = JSON.stringify(L); L.splice(k, 1); delArm = -1; saveL(); toast('Card deleted.', function () { L = JSON.parse(bak); saveL(); renderChk(); }); }
    } else if (g === 'add') { L.push({ id: 'c' + Date.now().toString(36), t: 'NEW CARD', i: [], nw: 1 }); edit = L.length - 1; }
    else if (g === 'clear') { var p2 = JSON.stringify(st); st = { tk: {}, done: {} }; saveS(); toast('All ticks cleared.', function () { st = JSON.parse(p2); saveS(); renderChk(); }); }
    else if (g === 'def') { var b2 = JSON.stringify(L); L = JSON.parse(JSON.stringify(DEF)); saveL(); toast('Default cards restored.', function () { L = JSON.parse(b2); saveL(); renderChk(); }); }
    renderChk(); renderPop(); paintExt();
    if (g === 'edit' || g === 'add') { var ta = chk.querySelector('.gedit .gti'); if (ta) { ta.focus(); if (g === 'add') ta.select(); } }
  }

  /* ---------- v1.2 (pilot 16 NOV 26): the checklist under the OTP bubble + a draggable pop-up of one card */
  function done_(c) { return !!st.done[c.id] || (c.i.length > 0 && cnt(c) === c.i.length); }
  function current() {   // the first card not complete, for the line under the OTP bubble
    if (!L || !st) return null;
    for (var k = 0; k < L.length; k++) { var c = L[k]; if (c.i.length && !done_(c)) return { k: k, t: c.t, n: cnt(c), tot: c.i.length }; }
    return L.length ? { k: -1, t: 'Checklist', n: 0, tot: 0, all: true } : null;
  }
  var pop = null, popK = -1, advT = null, PPK = 'fp.gnd.poppos';
  function nextOpen(after) { for (var k = after + 1; k < L.length; k++) if (L[k].i.length && !done_(L[k])) return k; for (k = 0; k < L.length; k++) if (L[k].i.length && !done_(L[k])) return k; return -1; }
  function advance(k) {   // last item ticked: the pop-up moves on to the next card
    if (!pop || pop.hidden || popK !== k) return;
    clearTimeout(advT); advT = setTimeout(function () { var n = nextOpen(k); if (n >= 0) { popK = n; renderPop(); toast('Next: ' + L[n].t); } else { renderPop(); } }, 900);
  }
  function ensurePop() {
    if (pop) return;
    pop = document.createElement('div'); pop.id = 'gnd-pop'; pop.className = 'gkpop'; pop.hidden = true; pop.setAttribute('role', 'dialog');
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) { if (e.target.closest('[data-gp=x]')) { closePop(); return; } if (e.target.closest('[data-gp=page]')) { closePop(); location.hash = 'gnd'; tab('chk'); return; } act(e); });
    var drag = null;
    pop.addEventListener('pointerdown', function (e) { if (!e.target.closest('.gkh') || e.target.closest('button')) return; drag = { dx: e.clientX - pop.offsetLeft, dy: e.clientY - pop.offsetTop }; try { pop.setPointerCapture(e.pointerId); } catch (x) { } pop.classList.add('drag'); e.preventDefault(); });
    pop.addEventListener('pointermove', function (e) { if (!drag) return; var W = window.innerWidth, H = window.innerHeight, x = Math.max(4, Math.min(W - pop.offsetWidth - 4, e.clientX - drag.dx)), y = Math.max(4, Math.min(H - 240, e.clientY - drag.dy)); pop.style.left = x + 'px'; pop.style.top = y + 'px'; fitPop(); e.preventDefault(); });
    function up() { if (!drag) return; drag = null; pop.classList.remove('drag'); try { localStorage.setItem(PPK, JSON.stringify({ x: pop.offsetLeft / window.innerWidth, y: pop.offsetTop / window.innerHeight })); } catch (x) { } }
    pop.addEventListener('pointerup', up); pop.addEventListener('pointercancel', up);
  }
  function placePop() {
    var p = null; try { p = JSON.parse(localStorage.getItem(PPK) || 'null'); } catch (e) { }
    var W = window.innerWidth, H = window.innerHeight, w = pop.offsetWidth || 360, h = pop.offsetHeight || 400, x, y;
    if (p) { x = p.x * W; y = p.y * H; }
    else { var b = document.getElementById('turn-bub'); if (b && !b.hidden) { x = b.offsetLeft - w - 14; y = b.offsetTop + b.offsetHeight - h; } else { x = (W - w) / 2; y = 80; } }
    var yy = Math.max(4, Math.min(H - 240, y)); pop.style.left = Math.max(4, Math.min(W - w - 4, x)) + 'px'; pop.style.top = yy + 'px'; fitPop();
  }
  function fitPop() { if (pop) pop.style.maxHeight = Math.max(220, window.innerHeight - pop.offsetTop - 8) + 'px'; }   // never runs off the bottom; scrolls inside
  function renderPop() {
    if (!pop || pop.hidden) return;
    var c = L[popK];
    pop.innerHTML = '<div class="gkh"><span class="gkhg" aria-hidden="true">⠿</span><b>Checklist</b><button type="button" class="gkl" data-gp="page">All cards</button><button type="button" class="gkx" data-gp="x" aria-label="Close">×</button></div>' +
      (c ? cardHtml(c, popK, true) : '<p class="note">All cards complete.</p>');
  }
  function openPop(k) {
    if (!L) return; ensurePop(); popK = k >= 0 ? k : nextOpen(-1); if (popK < 0) popK = 0;
    pop.hidden = false; renderPop(); placePop();
  }
  function closePop() { if (pop) pop.hidden = true; clearTimeout(advT); }
  var ext = [];   // painters outside this file (the OTP bubble line)
  function paintExt() { ext.forEach(function (f) { try { f(); } catch (e) { } }); }
  function init(rec) {
    el = $('gnd'); if (!el) return;
    fid = (rec && rec.id) || (window.FPRec && window.FPRec.id) || 'x';
    tabsEl = el.querySelector('.gtabs'); chk = $('gnd-chk'); otp = $('gnd-otp');
    loadL(); loadS(); renderChk();
    chk.addEventListener('click', act);
    if (tabsEl) tabsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-gt]'); if (b) tab(b.dataset.gt); });
    var t0 = 'chk'; try { t0 = sessionStorage.getItem('fp.gnd.tab') || 'chk'; } catch (e) { }
    tab(t0);
  }
  return { init: init, tab: tab, DEF: DEF, current: function () { return el ? current() : null; }, open: openPop, close: closePop, onChange: function (f) { ext.push(f); } };
})();
