/* fp_turn.js v1.0 (15 NOV 26) - STD TIMELINE page: a departure timeline counted from STD, run as live timers.
   The phases, their wording and the reference are read from the loaded flight file (data.turn) - this file holds no company text.
   - Starts by itself at the first phase on the flight's date (STD and date from the loaded flight; the pilot can type a new STD for a delay).
   - When a phase starts: chime + a phase card on screen (+ an iOS / browser notification when allowed) with Acknowledge / Hold / Complete.
     Hold = remind again in HOLD_MIN minutes until completed. Acknowledge = seen, phase open. Complete = done.
   - State stored per flight on this device (localStorage). Web apps stop their timers while the iPad is locked or the app is closed:
     on return every phase that started meanwhile is shown as DUE and the card comes up for the first open one. */
window.FPTurn = (function () {
  'use strict';
  var HOLD_MIN = 2;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(ms) { var d = new Date(ms); return pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + 'Z'; }
  function lt(ms) { var d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function mmss(s) { var neg = s < 0; s = Math.abs(Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (neg ? '−' : '') + (h ? h + ':' + pad(m) : m) + ':' + pad(x); }
  /* The phases come from the flight file (data.turn, built from the company manual on the pilot's side) - no document text in this public code.
     data.turn = { ref, src, hold_min, window: [-10, 3], note, phases: [{ id, min, title, dxb, out }] } (out empty = same as dxb) */
  var REF = '', PH = [], WIN = null, NOTE = '';
  function setup(T) {
    REF = T.ref || ''; HOLD_MIN = +T.hold_min || 2; WIN = Array.isArray(T.window) && T.window.length === 2 ? T.window : null; NOTE = T.note || '';
    PH = (T.phases || []).filter(function (p) { return p && p.id && isFinite(+p.min); }).map(function (p) { return [String(p.id), +p.min, p.title || '', p.dxb || p.text || '', p.out || null]; })
      .sort(function (a, b) { return a[1] - b[1]; });
  }
  var C = null, D = null, KEY = null, st = null, el = null, card = null, cardFor = null, lastTick = 0, started = false;
  function load() { try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; } if (!st || typeof st !== 'object') st = {}; st.items = st.items || {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function isDxb() { return (D.flight && (D.flight.dep === 'OMDB' || D.flight.dep_iata === 'DXB')); }
  /* STD on the flight's date, as epoch ms (a typed new STD wins; a time well before the planned one rolls to the next day) */
  function stdMs() {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(D.date || ''); if (!m) return null;
    var s = st.std || (D.flight && D.flight.std) || ''; var sm = /^(\d{1,2}):?(\d{2})$/.exec(s); if (!sm) return null;
    var base = Date.UTC(+m[1], +m[2] - 1, +m[3]), t = base + (+sm[1] * 60 + +sm[2]) * 60000;
    if (st.std && D.flight && D.flight.std) { var p = /^(\d{1,2}):?(\d{2})$/.exec(D.flight.std); if (p) { var t0 = base + (+p[1] * 60 + +p[2]) * 60000; if (t < t0 - 6 * 3600000) t += 86400000; } }
    return t;
  }
  function now() { return Date.now(); }
  function phaseAt(i) { var s = stdMs(); return s == null ? null : s + PH[i][1] * 60000; }
  function stateOf(i) { var it = st.items[PH[i][0]]; return it ? it.s : null; }
  function setState(i, s) {
    var id = PH[i][0], it = st.items[id] || {}; it.s = s; it.t = new Date().toISOString();
    if (s === 'hold') it.until = now() + HOLD_MIN * 60000; else delete it.until;
    st.items[id] = it; save(); if (cardFor === i) closeCard(); render(); check(true);
  }
  function chime(n) { try { if (C && C.chime) C.chime(n, true); } catch (e) { } }
  function notify(i, again) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var body = PH[i][3 + (isDxb() || !PH[i][4] ? 0 : 1)] || PH[i][3], title = (again ? 'HOLD · ' : '') + 'STD ' + (PH[i][1] < 0 ? PH[i][1] : '+' + PH[i][1]) + ' · ' + PH[i][2];
      var o = { body: body, tag: 'fp-turn-' + PH[i][0], renotify: true };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification(title, o); }).catch(function () { try { new Notification(title, o); } catch (e) { } });
      else new Notification(title, o);
    } catch (e) { }
  }
  /* ---------- phase card (on top of every page) */
  function openCard(i, again) {
    if (!card) { card = document.createElement('div'); card.id = 'turn-card'; card.className = 'tcard'; card.setAttribute('role', 'alertdialog'); card.setAttribute('aria-live', 'assertive'); document.body.appendChild(card);
      card.addEventListener('click', function (ev) { var b = ev.target.closest('[data-ta]'); if (!b) return; var k = +b.dataset.i; if (b.dataset.ta === 'open') { location.hash = 'turn'; closeCard(); return; } setState(k, b.dataset.ta); }); }
    cardFor = i; var p = PH[i], txt = (isDxb() || !p[4]) ? p[3] : p[4];
    card.innerHTML = '<div class="tch"><span class="tck">' + (again ? 'HOLD · AGAIN' : 'NOW') + '</span><b>STD ' + (p[1] < 0 ? '−' + (-p[1]) : '+' + p[1]) + ' · ' + esc(p[2]) + '</b><small>' + hhmm(phaseAt(i)) + ' · ' + esc(REF) + '</small></div>' +
      '<p>' + esc(txt) + '</p><div class="tcb"><button type="button" data-ta="ack" data-i="' + i + '">Acknowledge</button><button type="button" data-ta="hold" data-i="' + i + '">Hold ' + HOLD_MIN + ' min</button><button type="button" class="tcok" data-ta="done" data-i="' + i + '">Complete</button><button type="button" class="tcl" data-ta="open" data-i="' + i + '">Timeline</button></div>';
    card.hidden = false;
  }
  function closeCard() { if (card) card.hidden = true; cardFor = null; }
  /* ---------- the engine: called every second */
  function check(quiet) {
    if (!D) return; var s = stdMs(); if (s == null) return; var t = now();
    st.fired = st.fired || {};
    for (var i = 0; i < PH.length; i++) {
      var at = phaseAt(i), id = PH[i][0], it = st.items[id];
      if (t < at) continue;
      if (t - at > 3 * 3600000) continue;   // a past flight: no alerts
      var key = id + '@' + at;
      if (!st.fired[key]) { st.fired[key] = 1; save(); if (!it || !it.s) { if (!quiet || cardFor == null) { openCard(i, false); if (!quiet) { chime(2); notify(i, false); } } } }
      else if (it && it.s === 'hold' && it.until && t >= it.until) { it.until = t + HOLD_MIN * 60000; save(); openCard(i, true); chime(1); notify(i, true); }
    }
  }
  /* after a pause (iPad locked / app reopened): bring up the first started phase that is still open */
  function resume() {
    if (!D || cardFor != null) return; var t = now();
    if (el && !el.closest('.view').hidden) return;   // the timeline page itself is on screen: its rows carry the same buttons
    for (var k = 0; k < PH.length; k++) { var a = phaseAt(k); if (a != null && t >= a && t - a < 3 * 3600000 && !stateOf(k)) { openCard(k, false); break; } }
  }
  /* ---------- page */
  function render() {
    if (!el || !D) return;
    var s = stdMs(), t = now(), dxb = isDxb();
    if (s == null) { el.innerHTML = '<div class="msg">No STD in this flight - type the STD below.</div>' + stdForm(); bindForm(); return; }
    var first = phaseAt(0), lastA = phaseAt(PH.length - 1), cur = -1;
    for (var i = 0; i < PH.length; i++) if (t >= phaseAt(i)) cur = i;
    var head;
    if (t < first) head = '<div class="thead"><b>Starts at STD' + (PH[0][1] < 0 ? '−' + (-PH[0][1]) : '+' + PH[0][1]) + ' · ' + hhmm(first) + '</b><span class="tbig" data-tcd="' + first + '">' + mmss((first - t) / 1000) + '</span><small>to crew at the aeroplane · STD ' + hhmm(s) + ' (' + lt(s) + ' iPad time)</small></div>';
    else if (t <= lastA + 15 * 60000) head = '<div class="thead on"><b>STD ' + hhmm(s) + '</b><span class="tbig" data-tcd="' + s + '">' + mmss((s - t) / 1000) + '</span><small>' + (t < s ? 'to STD' : 'since STD') + (WIN ? ' · off-block target ' + hhmm(s + WIN[0] * 60000) + ' – ' + hhmm(s + WIN[1] * 60000) : '') + '</small></div>';
    else head = '<div class="thead"><b>Timeline finished</b><small>STD ' + hhmm(s) + ' · ' + PH.filter(function (p, i) { return stateOf(i) === 'done'; }).length + ' of ' + PH.length + ' completed</small></div>';
    var rows = PH.map(function (p, i) {
      var at = phaseAt(i), sx = stateOf(i), next = i + 1 < PH.length ? phaseAt(i + 1) : null, cls, badge;
      if (sx === 'done') { cls = 'done'; badge = 'DONE'; }
      else if (sx === 'hold') { cls = 'hold'; badge = 'HOLD'; }
      else if (sx === 'ack') { cls = 'ack'; badge = 'ACK'; }
      else if (t >= at) { cls = 'due'; badge = 'DUE'; }
      else { cls = 'wait'; badge = ''; }
      if (i === cur && sx !== 'done') cls += ' cur';
      var cd = t < at ? '<span class="tcd" data-tcd="' + at + '">' + mmss((at - t) / 1000) + '</span>' : (next && t < next && sx !== 'done' ? '<span class="tcd run" data-tup="' + at + '">' + mmss((t - at) / 1000) + '</span>' : '');
      var txt = (dxb || !p[4]) ? p[3] : p[4], it = st.items[p[0]];
      return '<li class="trow ' + cls + '"><div class="tm"><b>' + (p[1] < 0 ? '−' + (-p[1]) : (p[1] ? '+' + p[1] : 'STD')) + '</b><small>' + hhmm(at) + '</small></div>' +
        '<div class="tx"><b>' + esc(p[2]) + (badge ? ' <i class="tbd">' + badge + (it && it.t ? ' ' + hhmm(Date.parse(it.t)) : '') + '</i>' : '') + '</b><span>' + esc(txt) + '</span></div>' +
        '<div class="tr">' + cd + '<div class="tbs">' + (sx === 'done' ? '<button type="button" data-tb="undo" data-i="' + i + '">Undo</button>' :
          '<button type="button" data-tb="ack" data-i="' + i + '">Ack</button><button type="button" data-tb="hold" data-i="' + i + '">Hold</button><button type="button" class="tcok" data-tb="done" data-i="' + i + '">Complete</button>') + '</div></div></li>';
    }).join('');
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    el.innerHTML = '<div class="bar"><span>STD timeline · ' + (dxb ? 'Dubai (DXB)' : 'outstation') + '</span><small>' + esc(REF) + ' · starts by itself at STD' + (PH[0][1] < 0 ? '−' + (-PH[0][1]) : '+' + PH[0][1]) + '</small></div>' + head +
      '<ol class="tlist">' + rows + '</ol>' + stdForm() +
      '<div class="tset"><button type="button" id="turn-test">Test alert</button>' +
      (perm === 'default' ? '<button type="button" id="turn-perm">Allow notifications</button>' : '<small>Notifications: ' + (perm === 'granted' ? 'allowed' : perm === 'denied' ? 'blocked in iPad Settings' : 'not supported here') + '</small>') +
      '<button type="button" id="turn-reset">Reset this flight\'s timeline</button></div>' +
      '<p class="note">Each phase starts with a chime and a card: <b>Acknowledge</b> (seen, still open), <b>Hold</b> (reminds you again every ' + HOLD_MIN + ' min until you complete it), <b>Complete</b>. ' +
      'Alerts run while Flight Prep is open on screen – keep it in front (Settings → Keep screen on). If the iPad was locked, the phases that started meanwhile show as DUE and the card comes up when you return. ' +
      'Times from the STD of the loaded flight; type a new STD for a delay. ' + esc(NOTE) + ' Stored per flight on this iPad.</p>';
    bindForm();
  }
  function stdForm() {
    var s = (D.flight && D.flight.std) || '';
    return '<div class="tstd"><small>STD from the flight: <b>' + esc(s.replace(':', '')) + 'Z</b>' + (st.std ? ' · new STD in use: <b>' + esc(st.std.replace(':', '')) + 'Z</b>' : '') + '</small>' +
      '<label>New STD <input id="turn-std" inputmode="numeric" maxlength="4" placeholder="HHMM" autocomplete="off" value="' + esc(st.std ? st.std.replace(':', '') : '') + '"><i>Z</i></label>' +
      '<button type="button" id="turn-std-set">Set</button>' + (st.std ? '<button type="button" id="turn-std-clr">Use OFP STD</button>' : '') + '</div>';
  }
  function bindForm() {
    var b = $('turn-std-set'); if (b) b.onclick = function () { var v = ($('turn-std').value || '').replace(/\D/g, ''); if (!/^\d{4}$/.test(v) || +v.slice(0, 2) > 23 || +v.slice(2) > 59) { if (C && C.toast) C.toast('Type the STD as HHMM (UTC).'); return; } st.std = v.slice(0, 2) + ':' + v.slice(2); st.fired = {}; save(); closeCard(); render(); };
    var c = $('turn-std-clr'); if (c) c.onclick = function () { delete st.std; st.fired = {}; save(); closeCard(); render(); };
    var tt = $('turn-test'); if (tt) tt.onclick = function () { chime(2); openCard(0, false); notify(0, false); };
    var pp = $('turn-perm'); if (pp) pp.onclick = function () { try { var r = Notification.requestPermission(function () { render(); }); if (r && r.then) r.then(function () { render(); }); } catch (e) { } };
    var rs = $('turn-reset'); if (rs) rs.onclick = function () { st = { items: {}, fired: {}, std: st.std }; save(); closeCard(); render(); };
  }
  function onList(ev) {
    var b = ev.target.closest('[data-tb]'); if (!b) return; var i = +b.dataset.i, a = b.dataset.tb;
    if (a === 'undo') { delete st.items[PH[i][0]]; save(); render(); return; }
    setState(i, a);
  }
  function tickTexts() {
    if (!el || el.closest('.view').hidden) return; var t = now();
    el.querySelectorAll('[data-tcd]').forEach(function (x) { x.textContent = mmss((+x.dataset.tcd - t) / 1000); });
    el.querySelectorAll('[data-tup]').forEach(function (x) { x.textContent = mmss((t - +x.dataset.tup) / 1000); });
  }
  function loop() {
    var t = now(); check(false); tickTexts();
    if (el && !el.closest('.view').hidden) { var b = 0, s = stdMs(); if (s != null) for (var i = 0; i < PH.length; i++) if (t >= phaseAt(i)) b = i + 1; if (b !== lastTick) { lastTick = b; render(); } }
  }
  function init(data) {
    D = data; C = window.FPCore || null; el = $('turn'); if (!el || !D || !D.flight || !D.turn) return; setup(D.turn); if (!PH.length) return;
    KEY = 'fp.turn.' + (D.flight.id || (D.flight.flight + '-' + D.date));
    load(); render(); el.addEventListener('click', onList);
    // a phase that started while the app was closed is shown, but does not chime on opening
    check(true); resume();
    if (!started) { started = true; setInterval(loop, 1000); document.addEventListener('visibilitychange', function () { if (!document.hidden) { check(false); resume(); render(); } }); }
  }
  return { init: init, render: render, _check: check, _phases: function () { return PH; } };
})();
