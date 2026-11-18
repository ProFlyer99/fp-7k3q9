/* fp_nat.js v1.0 (17 NOV 26) - NAT (North Atlantic) page in the IN FLIGHT group (pilot request 17 NOV 26: "everything related to NAT … detailed
   procedure from navigation and communication point and a checklist tool to tick boxes when I am getting to NAT … what to do, when, how", incl. FCOM).
   Tabs: In-flight checklist (phases, timed against the oceanic entry point when the flight file has it) · This flight (OFP NAT data: entry / exit,
   oceanic waypoints with ETAs and a passing check per waypoint, OTS message, RCL / logon windows) · Procedures (navigation, communication, FCOM) ·
   Contingency. Company text comes in the 'nat' library file (fpapp.library.v1, kind 'nat') and flight data in data.nat - never in the public code.
   Ticks: 'fp.nat.<flight id>' (checklist) and 'fp.natw.<flight id>' (waypoint checks). */
window.FPNat = (function () {
  'use strict';
  var LIB = null, D = {}, FID = 'x', cur = 'chk', root = null;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setLib(l) { LIB = (l && l.kind === 'nat' && l.check) ? l : null; }
  function has() { return !!LIB || !!(D && D.nat); }
  function N() { return D.nat || null; }
  function C() { return window.FPCore || null; }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function put(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) { } }
  function hhmmZ(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return ('0' + Math.floor(min / 60)).slice(-2) + ('0' + (min % 60)).slice(-2) + 'Z'; }
  function nowMin() { var d = new Date(); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; }
  function toMin() { var c = C(); return c && c.toMin ? c.toMin() : null; }
  function plan() { var c = C(); return c && c.isPlan ? c.isPlan() : true; }
  /* elapsed (min from take-off) -> UTC minute of day */
  function utcOf(el) { var t = toMin(); return (t == null || el == null) ? null : t + el; }
  function rel(m) { if (m == null) return ''; var d = m - nowMin(); if (d < -720) d += 1440; if (d > 720) d -= 1440; var a = Math.abs(Math.round(d)); return d >= 0 ? 'in ' + (a >= 60 ? Math.floor(a / 60) + 'h' + ('0' + a % 60).slice(-2) : a + ' min') : (a >= 60 ? Math.floor(a / 60) + 'h' + ('0' + a % 60).slice(-2) : a + ' min') + ' ago'; }
  function oep() { var n = N(); return n && n.entry ? n.entry : null; }   // {name, el, fir}
  function anchorUtc(at) {   // 'OEP-90' / 'OEP+10' / 'EXIT-30' / 'BDY-20' (first OCA boundary inside the NAT) / 'EL725' (elapsed min)
    var n = N(); if (!n) return null; var e = /^EL(\d+)([+-]\d+)?$/.exec(at || ''); if (e) { var v = utcOf(+e[1]); return v == null ? null : v + (e[2] ? parseInt(e[2], 10) : 0); }
    var m = /^(OEP|EXIT|BDY)([+-]\d+)$/.exec(at || ''); if (!m) return null;
    var p = m[1] === 'OEP' ? n.entry : m[1] === 'EXIT' ? n.exit : (n.bdy && n.bdy[0]); if (!p || p.el == null) return null; var u = utcOf(p.el); return u == null ? null : u + parseInt(m[2], 10);
  }

  /* ---------- checklist. Current phase = the timed phase whose time is the latest one reached (15 min look-ahead), unless it is complete
     (then the next one not complete); no times -> the first phase not complete */
  function curPhase(T) {
    var now = nowMin(), best = -1, done = function (pi) { return LIB.check[pi].items.every(function (it, ii) { return T[pi + '.' + ii]; }); };
    LIB.check.forEach(function (ph, pi) { var u = anchorUtc(ph.at); if (u == null) return; var d = ((u - now + 2160) % 1440) - 720; if (d <= 15) best = pi; });
    var i = best < 0 ? 0 : best; while (i < LIB.check.length && done(i)) i++; return i < LIB.check.length ? i : -1;
  }
  function chkHtml() {
    if (!LIB) return '<p class="nat-empty">The NAT procedures library is not loaded. Load the NAT library file in FLIGHTS.</p>';
    var T = get('fp.nat.' + FID), n = N(), e = oep();
    var head = '<div class="nat-top">' + (e ? '<div class="nat-oep"><small>Oceanic entry</small><b>' + esc(e.name) + '</b><span>' + esc(e.fir || '') + '</span><em data-natutc="OEP+0">' + (utcOf(e.el) != null ? hhmmZ(utcOf(e.el)) : '') + '</em><i data-natrel="OEP+0"></i>' + (plan() ? '<small class="nat-pl">planned T/O – set T/O for actual times</small>' : '') + '</div>' : '<div class="nat-oep"><small>Oceanic entry</small><b>–</b><span>no NAT data in this flight file – times not computed</span></div>') +
      '<button type="button" class="cw-btn" data-natact="timers"' + (e ? '' : ' disabled') + '>Start NAT timer bubbles</button><button type="button" class="cw-btn cw-clr" data-natact="reset">Reset ticks</button></div>';
    var cp = curPhase(T);
    var body = LIB.check.map(function (ph, pi) {
      var done = ph.items.filter(function (it, ii) { return T[pi + '.' + ii]; }).length;
      return '<details class="nat-ph' + (pi === cp ? ' nat-now' : '') + '" data-ph="' + pi + '"' + (pi === cp ? ' open' : '') + '>' + (pi === cp ? '<span class="nat-nowb">NOW</span>' : '') + '<summary><b>' + esc(ph.ph) + '</b><span class="nat-when">' + esc(ph.when || '') + (ph.at ? ' · <em data-natutc="' + ph.at + '"></em> <i data-natrel="' + ph.at + '"></i>' : '') + '</span><span class="nat-cnt">' + done + '/' + ph.items.length + '</span></summary><ul class="nat-items">' +
        ph.items.map(function (it, ii) { var k = pi + '.' + ii, t = T[k];
          return '<li class="' + (t ? 'done' : '') + (it.k ? ' nat-' + it.k : '') + '"><label><input type="checkbox" data-natk="' + k + '"' + (t ? ' checked' : '') + '><span class="nat-t">' + it.t + '</span></label>' +
            (it.at ? '<span class="nat-at"><em data-natutc="' + it.at + '"></em> <i data-natrel="' + it.at + '"></i></span>' : '') + (t ? '<span class="nat-tk">✓ ' + esc(t) + '</span>' : '') +
            (it.how ? '<details class="nat-how"><summary>how</summary><div>' + it.how + '</div></details>' : '') + (it.r ? '<i class="cw-r">' + esc(it.r) + '</i>' : '') + '</li>'; }).join('') + '</ul></details>';
    }).join('');
    return head + body;
  }
  /* ---------- this flight */
  function fltHtml() {
    var n = N(); if (!n) return '<p class="nat-empty">This flight file has no NAT data.</p>';
    var W = get('fp.natw.' + FID);
    var h = '<div class="nat-sum">' + (n.summary || []).map(function (s) { return '<div><small>' + esc(s[0]) + '</small><b>' + esc(s[1]) + '</b></div>'; }).join('') + '</div>';
    if (n.wpts && n.wpts.length) {
      h += '<h4 class="nat-h">Oceanic waypoints – passing checks</h4><div class="cw-tw"><table class="cw-t nat-wt"><thead><tr><th>Waypoint</th><th>FIR</th><th>ETA</th><th>Passing check</th><th>+10 min check</th></tr></thead><tbody>' +
        n.wpts.map(function (w, i) { var u = utcOf(w.el), a = W[i + 'p'], b = W[i + 'q'];
          return '<tr class="' + (w.k || '') + '"><td><b>' + esc(w.name) + '</b>' + (w.note ? '<small>' + esc(w.note) + '</small>' : '') + '</td><td>' + esc(w.fir || '') + '</td><td><b>' + (u != null ? hhmmZ(u) : '') + '</b><small>' + (u != null ? rel(u) : '') + '</small></td>' +
            '<td><label class="nat-wc"><input type="checkbox" data-natw="' + i + 'p"' + (a ? ' checked' : '') + '>' + (a ? esc(a) : '') + '</label></td><td><label class="nat-wc"><input type="checkbox" data-natw="' + i + 'q"' + (b ? ' checked' : '') + '>' + (b ? esc(b) : '') + '</label></td></tr>'; }).join('') + '</tbody></table></div>' +
        (LIB && LIB.html && LIB.html.wptcheck ? '<div class="nat-note">' + LIB.html.wptcheck + '</div>' : '');
    }
    if (n.notes && n.notes.length) h += '<h4 class="nat-h">OFP NAT notes</h4><ul class="cw-l">' + n.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (n.ots) h += '<details class="cw-s"><summary>NAT track message (OTS) in the OFP</summary><pre class="nat-ots">' + esc(n.ots) + '</pre></details>';
    if (n.html) h += n.html;
    return h;
  }
  function render() { setTimeout(function () { if (root) paintTrees(); }, 0);
    if (!root) return;
    var tabs = [['chk', 'In-flight checklist'], ['flt', 'This flight'], ['proc', 'Procedures'], ['cont', 'Contingency']];
    if (!LIB) tabs = tabs.filter(function (t) { return t[0] === 'chk' || t[0] === 'flt'; });
    root.innerHTML = '<div class="gtabs nat-tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-nt="' + t[0] + '"' + (t[0] === cur ? ' class="on" aria-selected="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="nat-p cw-pane" data-p="chk">' + chkHtml() + '</div><div class="nat-p cw-pane" data-p="flt">' + fltHtml() + '</div>' +
      (LIB ? '<div class="nat-p cw-pane" data-p="proc">' + LIB.html.proc + '</div><div class="nat-p cw-pane" data-p="cont">' + LIB.html.cont + '</div>' : '') +
      (LIB ? '<details class="cw-src"><summary>Sources and checks</summary><ul>' + (LIB.sources || []).map(function (s) { return '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + ' – ' + esc(s[2]) + '</li>'; }).join('') + '</ul>' + (LIB.flags && LIB.flags.length ? '<p><b>To check:</b></p><ul>' + LIB.flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') + '<p class="cw-sm">Library ' + esc(LIB.title || '') + ' · built ' + esc(LIB.built_utc || '') + '. Preparation aid – OM-A / OM-C / FCOM / Lido RM in DocuNet prevail.</p></details>' : '');
    show(cur); paintTimes();
  }
  function show(t) {
    if (!root.querySelector('.nat-p[data-p="' + t + '"]')) t = 'chk'; cur = t;
    root.querySelectorAll('.nat-p').forEach(function (p) { p.hidden = p.dataset.p !== t; });
    root.querySelectorAll('[data-nt]').forEach(function (b) { var o = b.dataset.nt === t; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
  }
  var lastCp = null;
  function paintTimes() {
    if (!root) return;
    if (LIB) { var cp = curPhase(get('fp.nat.' + FID)); if (lastCp !== null && cp !== lastCp) { root.querySelectorAll('.nat-ph').forEach(function (d) { var on = +d.dataset.ph === cp; d.classList.toggle('nat-now', on); var b = d.querySelector(':scope > .nat-nowb'); if (on && !b) d.insertAdjacentHTML('afterbegin', '<span class="nat-nowb">NOW</span>'); if (!on && b) b.remove(); if (on) d.open = true; }); } lastCp = cp; }
    root.querySelectorAll('[data-natutc]').forEach(function (e) { var u = anchorUtc(e.dataset.natutc); e.textContent = u == null ? '' : hhmmZ(u); });
    root.querySelectorAll('[data-natrel]').forEach(function (e) { var u = anchorUtc(e.dataset.natrel); e.textContent = u == null ? '' : rel(u); var d = u == null ? 99 : ((u - nowMin() + 2160) % 1440) - 720; e.className = d < 0 ? 'past' : (d <= 15 ? 'soon' : ''); });
  }
  function startTimers() {
    var c = C(), n = N(); if (!c || !n || !LIB) return; var now = nowMin(), base = Date.now(), L = [];
    (LIB.timers || []).concat(n.timers || []).forEach(function (t) { var u = anchorUtc(t.at); if (u == null) return; var d = ((u - now + 2160) % 1440) - 720; if (d > 0) L.push([d, t.name]); });
    L.sort(function (a, b) { return a[0] - b[0]; });
    L.forEach(function (x, i) { c.S.timers = (c.S.timers || []).filter(function (y) { return y.name !== x[1]; });
      c.S.timers.push({ id: 'n' + Date.now().toString(36) + i, name: x[1], min: 0, end: base + x[0] * 60000, rep: false, start: base, bub: i === 0 ? 'on' : 'hidden' }); });
    c.save(); if (c.toast) c.toast(L.length + ' NAT timers started – the next one as a bubble, the others on the edge tab and the Timers board.');
  }
  /* ---------- interactive decision trees (data in LIB.trees, placeholders in the library html) */
  var DT = {};
  function dtHtml(id) {
    var T = LIB && LIB.trees && LIB.trees[id]; if (!T) return '';
    var st = DT[id] || (DT[id] = { path: [], cur: T.start }), N = T.nodes, h = '';
    if (T.title) h += '<div class="dt-t">' + T.title + '</div>';
    st.path.forEach(function (p, i) { h += '<div class="dt-done"><span>' + N[p[0]].q + '</span><b class="' + (p[1] ? 'y' : 'n') + '">' + (p[1] ? 'Yes' : 'No') + '</b><button type="button" class="dt-back" data-dt="' + id + '" data-dta="back" data-dti="' + i + '">change</button></div>'; });
    var n = N[st.cur] || {};
    if (n.q) h += '<div class="dt-q"><p>' + n.q + '</p>' + (n.help ? '<small>' + n.help + '</small>' : '') + '<div class="dt-btns"><button type="button" class="dt-y" data-dt="' + id + '" data-dta="yes">Yes</button><button type="button" class="dt-n" data-dt="' + id + '" data-dta="no">No</button></div></div>';
    else h += '<div class="dt-r dt-' + (n.k || 'ok') + '"><small>Result</small>' + (n.remark ? '<div class="dt-rem">' + n.remark + '</div>' : '') + (n.r ? '<p>' + n.r + '</p>' : '') + (n.out ? '<div class="dt-out">' + n.out + '</div>' : '') + (n.note ? '<small class="dt-note">' + n.note + '</small>' : '') + (n.ref ? '<i class="cw-r">' + n.ref + '</i>' : '') + '</div>';
    if (st.path.length) h += '<button type="button" class="dt-reset" data-dt="' + id + '" data-dta="reset">Start again</button>';
    return h;
  }
  function paintTrees(scope) { (scope || root).querySelectorAll('.nat-dt[data-tree]').forEach(function (el) { el.innerHTML = dtHtml(el.dataset.tree); }); }
  function wire() {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nt]'); if (b) { show(b.dataset.nt); window.scrollTo(0, 0); return; }
      var d = e.target.closest('[data-dt]'); if (d) { var id = d.dataset.dt, T = LIB.trees[id], st = DT[id], a = d.dataset.dta;
        if (a === 'yes' || a === 'no') { var n = T.nodes[st.cur]; st.path.push([st.cur, a === 'yes']); st.cur = a === 'yes' ? n.yes : n.no; }
        else if (a === 'back') { var i = +d.dataset.dti; st.cur = st.path[i][0]; st.path = st.path.slice(0, i); }
        else if (a === 'reset') { st.path = []; st.cur = T.start; }
        var box = d.closest('.nat-dt'); box.innerHTML = dtHtml(id); return; }
      var a = e.target.closest('[data-natact]'); if (!a) return;
      if (a.dataset.natact === 'timers') startTimers();
      else if (a.dataset.natact === 'reset') { if (!a._arm) { a._arm = 1; a.textContent = 'Reset all ticks?'; a.classList.add('arm'); setTimeout(function () { a._arm = 0; a.textContent = 'Reset ticks'; a.classList.remove('arm'); }, 3000); } else { put('fp.nat.' + FID, {}); put('fp.natw.' + FID, {}); render(); } }
    });
    root.addEventListener('change', function (e) {
      var t = e.target, c = C(), stamp = (c && c.nowHHMM ? c.nowHHMM() : hhmmZ(nowMin()).slice(0, 4)) + 'Z';
      if (t.dataset.natk) { var T = get('fp.nat.' + FID); if (t.checked) T[t.dataset.natk] = stamp; else delete T[t.dataset.natk]; put('fp.nat.' + FID, T);
        var li = t.closest('li'), ph = t.closest('.nat-ph'), cnt = ph.querySelector('.nat-cnt'), all = ph.querySelectorAll('[data-natk]'), dn = ph.querySelectorAll('[data-natk]:checked').length;
        li.classList.toggle('done', t.checked); var tk = li.querySelector('.nat-tk'); if (tk) tk.remove(); if (t.checked) { var s = document.createElement('span'); s.className = 'nat-tk'; s.textContent = '✓ ' + stamp; li.querySelector('label').after(s); }
        cnt.textContent = dn + '/' + all.length; if (dn === all.length) { ph.open = false; var nx = ph.nextElementSibling; if (nx && nx.classList.contains('nat-ph')) nx.open = true; } paintTimes(); }
      if (t.dataset.natw) { var W = get('fp.natw.' + FID); if (t.checked) W[t.dataset.natw] = stamp; else delete W[t.dataset.natw]; put('fp.natw.' + FID, W); t.parentNode.lastChild.nodeType === 3 && t.parentNode.removeChild(t.parentNode.lastChild); if (t.checked) t.parentNode.appendChild(document.createTextNode(stamp)); }
    });
  }
  function init(d) {
    D = d || {}; FID = (window.FPRec && window.FPRec.id) || 'x'; root = $('nat'); if (!root) return;
    if (!root._w) { root._w = 1; wire(); setInterval(paintTimes, 15000); }
    render();
  }
  return { setLib: setLib, libOk: function () { return !!LIB; }, init: init, has: has, render: render, show: show, refresh: paintTimes };
})();
