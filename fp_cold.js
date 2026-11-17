/* fp_cold.js v1.1 (17 NOV 26) - icing conditions per FCOM GEN Definitions on every airport (WX·NOTAM tiles and cards) and on the tabs.
   v1.0 (17 NOV 26) - Cold weather and icing (pilot request 17 NOV 26: "follow OM-C 10.3.1.3 and build everything required, referenced to the manuals").
   DEP: "❄ Icing" tab = de/anti-icing worksheet (original + fillable, kept per flight) · OM-C 10.3 procedure · A350 actions · HOT tables · departure airport.
   NOW: an "Icing – in flight" card.  ARR: "❄ Icing" tab = cold weather arrival + the next departure's de/anti-icing set (worksheet, procedure, A350, HOT, airport).
   All company text and pictures come in the 'cold' library file Claude sends (fpapp.library.v1, kind 'cold') and the airport parts in the flight file
   (data.cold.dep / data.cold.arr) - never in the public app code. The tab is highlighted when the METAR / TAF of the airport shows +3 °C or colder,
   or snow / freezing / ice precipitation. */
window.FPCold = (function () {
  'use strict';
  var LIB = null, D = {}, FID = 'x', LV = {}, cur = { dep: 'ws', arr: 'arr' }, built = {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setLib(l) { LIB = (l && l.kind === 'cold' && l.html) ? l : null; }
  function has(k) { return !!LIB && (k === 'dep' || k === 'arr'); }

  /* ---------- weather assessment
     FCOM GEN Definitions - icing conditions: OAT (ground / take-off) 10 °C or below AND visible moisture in any form (clouds, fog with visibility
     1 600 m or less, rain, snow, sleet, ice crystals), or OAT 10 °C or below with snow, ice, standing water or slush on ramps / taxiways / runways.
     Applied to the OFP METAR (live METAR if loaded) and to every TAF group; temperature = METAR, or the TAF TN when colder.
     lv 1 = icing conditions may exist (FCOM definition) · lv 2 = also +3 °C or colder, or snow / freezing / ice precipitation (ground de/anti-icing likely). */
  var FROZ = /(^|\s)[-+]?(VC)?(SH|TS|BL|DR|FZ)?(SN|SG|PL|GS|GR|IC)\b|(^|\s)[-+]?(VC)?FZ(RA|DZ|FG|UP)\b/;
  var PRECIP = /(^|\s)[-+]?(SH|TS|FZ|BL|DR)?(RA|DZ|SN|SG|GS|PL|GR|IC|UP|RASN|SNRA)\b/;
  var CLOUD = /(^|\s)(FEW|SCT|BKN|OVC)\d{3}|(^|\s)VV\d{3}/;
  function vis(x) { var m = /(^|\s)(\d{4})(\s|$)/.exec(x); if (m && !/^\d{4}\/\d{4}$/.test(m[2])) return +m[2];
    m = /(^|\s)(M?)(\d+)?\s?(\d\/\d)?SM\b/.exec(x); if (m) { var v = (+(m[3] || 0)) + (m[4] ? eval(m[4]) : 0); return Math.round(v * 1609); } return null; }
  function moisture(x) {   // -> reason or ''
    x = ' ' + x.replace(/\bRMK\b.*$/, '') + ' ';
    var p = PRECIP.exec(x); if (p) return 'precipitation ' + p[0].trim();
    var v = vis(x); if (/(^|\s)(MI|BC|PR|FZ)?FG\b/.test(x) && (v == null || v <= 1600)) return 'fog' + (v != null ? ' ' + v + ' m' : '');
    if (/(^|\s)BR\b/.test(x) && v != null && v <= 1600) return 'mist ' + v + ' m';
    var c = CLOUD.exec(x); if (c) return 'cloud ' + c[0].trim();
    return '';
  }
  function apt(role) { var L = (D.wx || []).filter(function (w) { return w.role === role; }); return L[0] || null; }
  function temp(m) { var r = /(^|\s)(M?\d{2})\/(M?\d{2})?(\s|$)/.exec(m || ''); if (!r) return null; return parseInt(r[2].replace('M', '-'), 10); }
  function icing(w) {
    if (!w) return { lv: 0, why: [] };
    var met = w.live_metar || w.metar || '', taf = w.live_taf || w.taf || '', t = temp(met), why = [], lv = 0;
    var tn = /\bTN(M?\d{2})\//.exec(taf); var tmin = tn ? parseInt(tn[1].replace('M', '-'), 10) : null;
    var tl = tmin != null && (t == null || tmin < t) ? tmin : t;
    var mm = moisture(met), mt = '';
    (w.groups && w.groups.length ? w.groups.map(function (g) { return g.x; }) : [taf.replace(/^\S+\s+\S+\s+\S+\s+/, '')]).some(function (x) { mt = moisture(x); return !!mt; });
    if (tl != null && tl <= 10 && (mm || mt)) { lv = 1; why.push((tl > 0 ? '+' : '') + tl + ' °C' + (tmin != null && tl === tmin ? ' (TAF TN)' : '') + ' with ' + (mm ? mm + ' (METAR)' : mt + ' (TAF)')); }
    var fz = FROZ.exec(' ' + (met + ' ' + taf).replace(/\bRMK\b.*$/, '') + ' ');
    if (tl != null && tl <= 3) { lv = 2; why.push((tl > 0 ? '+' : '') + tl + ' °C – de/anti-icing possible'); }
    if (fz) { lv = 2; why.push('weather ' + fz[0].trim()); }
    if (tl == null && !fz) why.push('no temperature in the METAR');
    return { lv: lv, why: why, icao: w.icao, t: t };
  }
  function assess(role) { return icing(apt(role)); }
  function badge(w) {   // WX·NOTAM tiles / weather cards (works without the library: generic FCOM rule)
    var r = icing(w); if (!r.lv) return '';
    return '<span class="cw-badge cw-b' + r.lv + '" title="' + esc(r.why.join(' · ')) + '">❄ ' + (r.lv === 2 ? 'Icing cond · de-icing possible' : 'Icing conditions') + '</span>';
  }
  function init(d) {
    D = d || {}; FID = (window.FPRec && window.FPRec.id) || 'x'; built = {};
    LV = { dep: assess('DEP'), arr: assess('DEST') };
    if (LIB) nowCard();
  }
  function label(k) { var l = LV[k] || {}; return '❄ Icing' + (l.lv === 2 ? ' <i class="cw-dot2" aria-label="cold weather expected"></i>' : (l.lv === 1 ? ' <i class="cw-dot1" aria-label="icing conditions possible"></i>' : '')); }
  function cls(k) { var l = LV[k] || {}; return l.lv === 2 ? 'cw-hot' : (l.lv === 1 ? 'cw-warm' : ''); }
  function banner(k, icao) {
    var l = LV[k] || {}; if (!l.icao) return '';
    var t = l.lv === 2 ? 'Icing conditions and cold weather at ' + l.icao + ' – ground de/anti-icing possible' : (l.lv === 1 ? 'Icing conditions may exist at ' + l.icao + ' (FCOM definition)' : 'No icing conditions at ' + l.icao + ' in the OFP weather');
    return '<div class="cw-ban cw-l' + (l.lv || 0) + '"><b>' + esc(t) + '</b>' + (l.why.length ? '<span>' + esc(l.why.join(' · ')) + '</span>' : '') +
      '<small>FCOM GEN Definitions: OAT 10 °C or below with visible moisture (cloud, fog 1 600 m or less, rain, snow, sleet, ice crystals) or snow / ice / standing water / slush on the ground. Amber = also +3 °C or colder or snow / freezing / ice precipitation. From the OFP METAR / TAF – check the latest weather.</small></div>';
  }

  /* ---------- pictures: placed into figures, tap = full screen viewer with pen (FPWxc.view) */
  function hydrate(root) {
    root.querySelectorAll('.cw-iw[data-cwimg]').forEach(function (w) {
      if (w.firstChild) return; var k = w.dataset.cwimg, im = LIB.img[k]; if (!im) { w.closest('figure').hidden = true; return; }
      w.innerHTML = '<img loading="lazy" decoding="async" src="' + im.src + '" width="' + im.w + '" height="' + im.h + '" alt="' + esc(im.title) + '">';
    });
  }
  function openImg(key) {
    var im = LIB.img[key]; if (!im || !window.FPWxc || !window.FPWxc.view) return;
    window.FPWxc.view([{ page: key, src: im.src, w: im.w, h: im.h, title: im.title }], 0, 'fp.cold.ink.' + FID + '.' + key);
  }
  function openHot(list, i) {
    if (!window.FPWxc || !window.FPWxc.view) return;
    window.FPWxc.view(list.map(function (h) { return { page: h.t, src: h.src, w: h.w, h: h.h, title: 'Table ' + h.n + ' · ' + h.title }; }), i, 'fp.cold.ink.' + FID + '.hot');
  }

  /* ---------- worksheet v2.0: fillable copy, kept per flight (and per leg: this departure / the next departure from the arrival airport) */
  var WSF = [['prov', 'text', 'e.g. ICEMAN 123.125'], ['fluid', 'text', ''], ['loc', 'text', 'e.g. pad, bay 4'], ['eng', 'yn'], ['spec', 'area', ''], ['cc', 'ck'], ['pa', 'ck']].map(function (f) { return [f[0], null, f[1], f[2]]; });
  function TX(k) { return (LIB && LIB.txt && LIB.txt[k]) || ''; }
  function wsKey(leg) { return 'fp.cold.ws.' + FID + '.' + leg; }
  function wsGet(leg) { try { return JSON.parse(localStorage.getItem(wsKey(leg)) || '{}') || {}; } catch (e) { return {}; } }
  function wsSet(leg, o) { try { localStorage.setItem(wsKey(leg), JSON.stringify(o)); } catch (e) { } }
  function field(f, v) {
    var id = f[0]; if (f[1] == null) f = [id, TX('f_' + id), f[2], f[3]];
    if (f[2] === 'ck') return '<label class="cw-ck"><input type="checkbox" data-ws="' + id + '"' + (v[id] ? ' checked' : '') + '><span>' + esc(f[1]) + '</span></label>';
    if (f[2] === 'yn') return '<div class="cw-f"><span>' + esc(f[1]) + '</span><div class="cw-seg" data-wsseg="' + id + '">' + ['Y', 'N'].map(function (o) { return '<button type="button" data-v="' + o + '"' + (v[id] === o ? ' class="on"' : '') + '>' + o + '</button>'; }).join('') + '</div></div>';
    if (f[2] === 'area') return '<label class="cw-f"><span>' + esc(f[1]) + '</span><textarea rows="2" data-ws="' + id + '" placeholder="' + esc(f[3] || '') + '">' + esc(v[id] || '') + '</textarea></label>';
    return '<label class="cw-f"><span>' + esc(f[1]) + '</span><input data-ws="' + id + '" value="' + esc(v[id] || '') + '" placeholder="' + esc(f[3] || '') + '"' + (f[2] === 'num' ? ' inputmode="decimal"' : '') + '></label>';
  }
  function wsHtml(leg, icao) {
    var v = wsGet(leg), R = function (r) { return '<i class="cw-r">' + esc(r) + '</i>'; };
    return '<div class="cw-ws" data-leg="' + leg + '">' +
      '<div class="cw-wsh"><b>De-icing / anti-icing worksheet</b><small>v2.0 · fillable copy · ' + esc(icao || '') + ' · kept on this iPad for this flight</small>' +
      '<button type="button" class="cw-btn" data-cwact="orig">Original sheet ✎</button><button type="button" class="cw-btn" data-cwact="flow">Decision flow</button><button type="button" class="cw-btn cw-clr" data-cwact="wsclear">Clear</button></div>' +
      LIB.html.notperm +
      '<fieldset><legend>Before treatment</legend>' + WSF.map(function (f) { return field(f, v); }).join('') + '</fieldset>' +
      '<fieldset><legend>Local area de-icing ' + R('OM-C 10.3.3.5') + '</legend>' + field(['local', 'Local area de-icing only', 'ck'], v) +
      '<p class="cw-red" data-wsshow="local"' + (v.local ? '' : ' hidden') + '>' + TX('local_note') + '</p></fieldset>' +
      '<fieldset><legend>Hold over time (HOT) calculation</legend>' +
      '<div class="cw-f"><span>Fluid type</span><div class="cw-seg" data-wsseg="type">' + ['I', 'II', 'III', 'IV'].map(function (o) { return '<button type="button" data-v="' + o + '"' + (v.type === o ? ' class="on"' : '') + '>' + o + '</button>'; }).join('') + '</div></div>' +
      field(['brand', 'Fluid brand and concentration (%)', 'text', 'e.g. Safewing MP IV LAUNCH 100/0'], v) +
      field(['wx', 'Weather condition(s) considered', 'text', 'snowfall intensity: Table 57'], v) +
      field(['temp', TX('f_temp'), 'num', ''], v) +
      '<div class="cw-row2">' + field(['hmin', 'HOT min (h:mm or min)', 'text', '0:35'], v) + field(['hmax', 'HOT max (h:mm or min)', 'text', '1:10'], v) + '</div>' +
      '<div class="cw-f"><span>' + TX('start_hint') + '</span><div class="cw-inl"><input data-ws="start" inputmode="numeric" maxlength="4" placeholder="HHMM" value="' + esc(v.start || '') + '"><button type="button" class="cw-btn" data-cwact="now">Now</button></div></div>' +
      '<div class="cw-out" data-wsout="1"></div>' +
      '<p class="cw-sm">' + TX('hot_note') + '' + R('Worksheet v2.0 · OM-C 10.3.6') + '</p>' +
      '</fieldset>' +
      '<fieldset><legend>Post treatment</legend>' + field(['code', 'De-icing / anti-icing report (anti-icing code)', 'area', TX('code_ph')], v) +
      ((LIB && LIB.txt && LIB.txt.post) || []).map(function (f) { return field([f[0], f[1], 'ck'], v); }).join('') +
      '</fieldset></div>';
  }
  function hm2min(s) { s = String(s || '').trim(); if (!s) return null; var m = /^(\d{1,2})[:h.](\d{2})$/.exec(s); if (m) return +m[1] * 60 + +m[2]; if (/^\d{1,3}$/.test(s)) return +s; return null; }
  function utcMs(hhmm) {   // HHMM UTC -> ms; a time more than 12 h in the future is taken as yesterday
    if (!/^\d{4}$/.test(hhmm || '')) return null; var h = +hhmm.slice(0, 2), m = +hhmm.slice(2); if (h > 23 || m > 59) return null;
    var n = new Date(), t = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), h, m); if (t - Date.now() > 12 * 3600e3) t -= 864e5; if (Date.now() - t > 12 * 3600e3) t += 864e5; return t;
  }
  function z(ms) { var d = new Date(ms); return ('0' + d.getUTCHours()).slice(-2) + ('0' + d.getUTCMinutes()).slice(-2) + 'Z'; }
  function mmss(s) { s = Math.round(Math.abs(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + x).slice(-2); }
  function wsOut(box) {
    var leg = box.dataset.leg, v = wsGet(leg), o = box.querySelector('[data-wsout]'); if (!o) return;
    if (v.local) { o.innerHTML = '<div class="cw-res cw-l2"><b>Local area de-icing – holdover times do not apply.</b></div>'; return; }
    var a = hm2min(v.hmin), b = hm2min(v.hmax), s = utcMs(v.start);
    if (s == null || (a == null && b == null)) { o.innerHTML = '<div class="cw-res"><small>Enter HOT min / max and the start time: the expiry times and a live countdown appear here.</small></div>'; return; }
    var now = Date.now(), r = [];
    function line(lab, mins) { if (mins == null) return; var e = s + mins * 60000, left = (e - now) / 1000;
      r.push('<div class="cw-x ' + (left <= 0 ? 'exp' : (left <= 300 ? 'soon' : '')) + '"><span>' + lab + '</span><b>' + z(e) + '</b><em data-cwcd="' + e + '">' + (left > 0 ? 'in ' + mmss(left) : 'EXPIRED ' + mmss(left) + ' ago') + '</em></div>'); }
    line('Minimum HOT expires (UTC)', a); line('Maximum HOT expires (UTC)', b);
    var warn = '';
    if (v.type === 'I') warn = '<p class="cw-red">' + TX('w_t1') + '</p>';
    else if (a != null && now > s + a * 60000) warn = '<p class="cw-amb">' + TX('w_min') + '</p>';
    if (b != null && now > s + b * 60000) warn = '<p class="cw-red">' + TX('w_max') + '</p>';
    o.innerHTML = '<div class="cw-res">' + r.join('') + '<button type="button" class="cw-btn" data-cwact="timers">Start HOT timer bubbles</button></div>' + warn;
  }
  function hotTimers(box) {
    var v = wsGet(box.dataset.leg), s = utcMs(v.start), C = window.FPCore; if (!C || s == null) return;
    var add = function (lab, mins) { if (mins == null) return; var e = s + mins * 60000; if (e <= Date.now()) return;
      C.S.timers = (C.S.timers || []).filter(function (t) { return t.name !== lab; });
      C.S.timers.push({ id: 't' + Date.now().toString(36) + lab.length, name: lab, min: 0, end: e, rep: false, start: Date.now(), bub: 'on' }); };
    var ty = v.type ? ' (Type ' + v.type + ')' : '';
    add('HOT min' + ty, hm2min(v.hmin)); add('HOT max' + ty, hm2min(v.hmax)); C.save();
    if (C.toast) C.toast('HOT timers started – bubbles on every page; also on the Timers board.');
  }

  /* ---------- HOT tables page */
  function hotHtml() {
    var H = LIB.hot, by = function (g) { return H.filter(function (h) { return h.grp === g; }); };
    function card(h) { return '<button type="button" class="cw-hc' + (h.a350 ? ' a350' : '') + (h.generic ? ' gen' : '') + '" data-cwhot="' + h.t + '"><b>Table ' + h.n + '</b><span>' + esc(h.title) + '</span>' +
      (h.at ? '<em class="at-' + h.at + '">' + (h.at === 'none' ? 'no allowance times' : 'allowance ' + h.at) + '</em>' : '') + (h.flag ? '<em class="flag">check</em>' : '') + '</button>'; }
    return '<div class="cw-hot">' +
      '<div class="cw-a350">' + card(H.filter(function (h) { return h.a350; })[0]) + '<p><b>A350 Type I = Table 3 (composite surfaces).</b> Type I aluminium (Table 2) is for A380 / B777 / A319 only.<i class="cw-r">OM-C 10.3.10 Table 1 note 1</i></p></div>' +
      '<details class="cw-s" open><summary>Quick reference and timeline<i class="cw-r">OM-C 10.3.1.1 · 10.3.1.4</i></summary>' +
      '<figure class="cw-fig" data-cwimg="quickref"><div class="cw-iw" data-cwimg="quickref"></div><figcaption>OM-C 10.3.1.4 – quick reference <span class="cw-zoom">tap for full screen · ✎</span></figcaption></figure>' +
      '<figure class="cw-fig" data-cwimg="timeline"><div class="cw-iw" data-cwimg="timeline"></div><figcaption>OM-C 10.3.1.1 – timeline after start of anti-icing <span class="cw-zoom">tap · ✎</span></figcaption></figure></details>' +
      '<details class="cw-s" open><summary>Table 57 – snowfall intensity from visibility<i class="cw-r">OM-C 10.3.1.2</i></summary>' + LIB.html.t57 + '</details>' +
      '<details class="cw-s" open><summary>Holdover tables<i class="cw-r">OM-C 10.3.10</i></summary>' +
      '<h5>Active frost</h5><div class="cw-hg">' + by('frost').map(card).join('') + '</div>' +
      '<h5>Type I</h5><div class="cw-hg">' + by('I').map(card).join('') + '</div>' +
      '<h5>Type II – generic first, then brands</h5><div class="cw-hg">' + by('II').map(card).join('') + '</div>' +
      '<h5>Type III</h5><div class="cw-hg">' + by('III').map(card).join('') + '</div>' +
      '<h5>Type IV – generic first, then brands</h5><div class="cw-hg">' + by('IV').map(card).join('') + '</div>' +
      '<p class="cw-sm">Brand-specific tables give longer HOTs and should be used when the brand is known; otherwise the generic table. Tap a table: full screen with zoom and pen, notes below it.<i class="cw-r">OM-C 10.3.9</i></p></details>' +
      '<div class="cw-hv" hidden></div>' +
      '<details class="cw-s"><summary>Ice pellets and small hail – allowance times (Tables 53-56)<i class="cw-r">OM-C 10.3.11</i></summary><div class="cw-allow">' + LIB.html.allow + '</div></details>' +
      '<details class="cw-s"><summary>HOT calculation examples · fluid colours<i class="cw-r">OM-C 10.3.7.3 · 10.3.9</i></summary>' +
      ['ex1', 'ex2', 'colours'].map(function (k) { return '<figure class="cw-fig" data-cwimg="' + k + '"><div class="cw-iw" data-cwimg="' + k + '"></div><figcaption>' + esc(LIB.img[k] ? LIB.img[k].title : k) + ' <span class="cw-zoom">tap · ✎</span></figcaption></figure>'; }).join('') + '</details>' +
      '</div>';
  }
  function showHot(root, t) {
    var H = LIB.hot, i = H.map(function (h) { return h.t; }).indexOf(t), h = H[i], v = root.querySelector('.cw-hv'); if (!h || !v) return;
    v.hidden = false;
    v.innerHTML = '<div class="cw-hvh"><b>Table ' + h.n + ' · ' + esc(h.title) + '</b><button type="button" class="cw-btn" data-cwact="hotfull" data-t="' + h.t + '">Full screen ✎</button><button type="button" class="cw-btn" data-cwact="hotx">×</button></div>' +
      (h.flag ? '<p class="cw-amb">' + esc(h.flag) + '</p>' : '') +
      '<img src="' + h.src + '" width="' + h.w + '" height="' + h.h + '" alt="Table ' + h.n + '" data-cwact="hotfull" data-t="' + h.t + '">' +
      '<ol class="cw-notes">' + h.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ol><p class="cw-sm">Notes as printed under the table in OM-C 10.3.10.</p>';
    v.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ---------- airport part (flight file) */
  function aptHtml(which) {
    var A = D.cold && D.cold[which]; if (!A || !A.html) return '';
    return '<div class="cw-apt">' + A.html + '</div>';
  }
  function aptName(which) { var A = D.cold && D.cold[which]; return A && A.icao ? A.icao : ''; }

  /* ---------- the panes */
  function chips(list, on) { return '<div class="cw-chips" role="tablist">' + list.map(function (c) { return c[0] === '|' ? '<span class="cw-cl">' + esc(c[1]) + '</span>' : '<button type="button" role="tab" data-cwc="' + c[0] + '"' + (c[0] === on ? ' class="on" aria-selected="true"' : '') + '>' + esc(c[1]) + '</button>'; }).join('') + '</div>'; }
  function render(k, el) {
    if (!LIB) return; var F = D.flight || {};
    var dIc = F.dep || '', aIc = F.arr || '', h = '';
    if (k === 'dep') {
      var L = [['ws', 'Worksheet'], ['proc', 'Procedure OM-C 10.3'], ['a350', 'A350 actions'], ['hot', 'HOT tables']];
      if (aptHtml('dep')) L.push(['apt', dIc + ' de-icing']);
      h = banner('dep') + chips(L, cur.dep) +
        '<div class="cw-p" data-p="ws">' + wsHtml('dep', dIc) + '</div><div class="cw-p" data-p="proc">' + LIB.html.proc + '</div><div class="cw-p" data-p="a350">' + LIB.html.a350 + '</div>' +
        '<div class="cw-p" data-p="hot">' + hotHtml() + '</div>' + (aptHtml('dep') ? '<div class="cw-p" data-p="apt">' + aptHtml('dep') + '</div>' : '');
    } else if (k === 'arr') {
      var M = [['arr', 'Cold weather arrival'], ['|', 'Next departure from ' + aIc + ':'], ['ws', 'Worksheet'], ['proc', 'Procedure'], ['a350', 'A350'], ['hot', 'HOT tables']];
      if (aptHtml('arr')) M.push(['apt', aIc + ' de-icing']);
      h = banner('arr') + chips(M, cur.arr) +
        '<div class="cw-p" data-p="arr">' + LIB.html.arr + '</div><div class="cw-p" data-p="ws">' + wsHtml('ret', aIc) + '</div><div class="cw-p" data-p="proc">' + LIB.html.proc + '</div>' +
        '<div class="cw-p" data-p="a350">' + LIB.html.a350 + '</div><div class="cw-p" data-p="hot">' + hotHtml() + '</div>' + (aptHtml('arr') ? '<div class="cw-p" data-p="apt">' + aptHtml('arr') + '</div>' : '');
    }
    h += '<details class="cw-src"><summary>Sources and checks</summary><ul>' + LIB.sources.map(function (s) { return '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + ' – ' + esc(s[2]) + '</li>'; }).join('') + '</ul>' +
      (LIB.flags && LIB.flags.length ? '<p><b>To check:</b></p><ul>' + LIB.flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="cw-sm">Library ' + esc(LIB.title) + ' · built ' + esc(LIB.built_utc) + '. Preparation aid – OM-A / OM-C / FCOM in DocuNet prevail.</p></details>';
    el.innerHTML = h; el.classList.add('cw-pane');
    hydrate(el); calc(el); el.querySelectorAll('.cw-ws').forEach(wsOut); pick(k, el, cur[k]);
    if (!el._cw) { el._cw = 1; wire(k, el); }
    built[k] = 1;
  }
  function pick(k, el, c) {
    cur[k] = c; el.querySelectorAll('.cw-chips [data-cwc]').forEach(function (b) { var o = b.dataset.cwc === c; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
    el.querySelectorAll(':scope > .cw-p').forEach(function (p) { p.hidden = p.dataset.p !== c; });
  }
  function wire(k, el) {
    el.addEventListener('click', function (e) {
      var c = e.target.closest('[data-cwc]'); if (c) { pick(k, el, c.dataset.cwc); el.scrollIntoView({ block: 'start' }); return; }
      var f = e.target.closest('figure[data-cwimg]'); if (f) { openImg(f.dataset.cwimg); return; }
      var hc = e.target.closest('[data-cwhot]'); if (hc) { showHot(hc.closest('.cw-hot'), hc.dataset.cwhot); return; }
      var sg = e.target.closest('[data-wsseg] button'); if (sg) { var box = sg.closest('.cw-ws'), id = sg.parentNode.dataset.wsseg, v = wsGet(box.dataset.leg); v[id] = v[id] === sg.dataset.v ? '' : sg.dataset.v; wsSet(box.dataset.leg, v);
        sg.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v[id]); }); wsOut(box); return; }
      var a = e.target.closest('[data-cwact]'); if (!a) return; var act = a.dataset.cwact, wsb = a.closest('.cw-ws');
      if (act === 'orig') openImg('ws'); else if (act === 'flow') openImg('flow');
      else if (act === 'now' && wsb) { var n = new Date(), s = ('0' + n.getUTCHours()).slice(-2) + ('0' + n.getUTCMinutes()).slice(-2), v2 = wsGet(wsb.dataset.leg); v2.start = s; wsSet(wsb.dataset.leg, v2); wsb.querySelector('[data-ws="start"]').value = s; wsOut(wsb); }
      else if (act === 'timers' && wsb) hotTimers(wsb);
      else if (act === 'wsclear' && wsb) { if (!a._arm) { a._arm = 1; a.textContent = 'Clear all?'; a.classList.add('arm'); setTimeout(function () { a._arm = 0; a.textContent = 'Clear'; a.classList.remove('arm'); }, 3000); }
        else { try { localStorage.removeItem(wsKey(wsb.dataset.leg)); } catch (x) { } var leg = wsb.dataset.leg, ic = wsb.querySelector('.cw-wsh small').textContent.split('·')[2] || ''; var tmp = document.createElement('div'); tmp.innerHTML = wsHtml(leg, ic.trim()); wsb.replaceWith(tmp.firstChild); wsOut(el.querySelector('.cw-ws[data-leg="' + leg + '"]')); } }
      else if (act === 'hotfull') { var H = LIB.hot, i = H.map(function (h) { return h.t; }).indexOf(a.dataset.t); openHot(H, i); }
      else if (act === 'hotx') { var hv = a.closest('.cw-hv'); hv.hidden = true; hv.innerHTML = ''; }
    });
    el.addEventListener('input', function (e) {
      var t = e.target; if (t.dataset.ws) { var box = t.closest('.cw-ws'), v = wsGet(box.dataset.leg); v[t.dataset.ws] = t.type === 'checkbox' ? t.checked : t.value; wsSet(box.dataset.leg, v);
        if (t.dataset.ws === 'local') { var p = box.querySelector('[data-wsshow="local"]'); if (p) p.hidden = !t.checked; }
        if (/^(hmin|hmax|start|local|type)$/.test(t.dataset.ws)) wsOut(box); return; }
      if (t.closest('.cw-calc')) calcRun(t.closest('.cw-calc'));
    });
  }
  /* ---------- OM-C 10.4.1.2 correction helper (table lookup, interpolation between columns / rows as the table is printed; linear extrapolation above 5000 ft) */
  function calc(root) {
    root.querySelectorAll('[data-cwcalc="corr"]').forEach(function (c) {
      var ae = (D.aptinfo && D.flight && D.aptinfo[D.flight.arr] && D.aptinfo[D.flight.arr].elev) || '';
      c.innerHTML = '<b>Correction helper</b><small>OM-C 10.4.1.2 table · uses the next colder temperature row and the next higher height column (conservative); linear extrapolation above 5000 ft</small>' +
        '<div class="cw-ci"><label>Aerodrome temp °C<input data-cc="t" inputmode="numeric" placeholder="-12"></label><label>Aerodrome elevation ft<input data-cc="e" inputmode="numeric" value="' + esc(ae) + '" placeholder="118"></label>' +
        '<label>Published altitudes ft (comma list)<input data-cc="a" placeholder="3000, 2000, 1500, 650"></label></div><div class="cw-co" data-cc="o"></div>';
    });
  }
  function corrFor(T, h) {   // T = table row (0 .. -50); h = height above the source: next higher table column (conservative), linear extrapolation above 5000 ft
    var C = LIB.corr, row = C.rows.filter(function (r) { return r[0] === T; })[0]; if (!row) return null; var H = C.h, v = row.slice(1);
    for (var i = 0; i < H.length; i++) if (h <= H[i]) return v[i];
    var n = H.length - 1; return v[n] + (v[n] - v[n - 1]) * (h - H[n]) / (H[n] - H[n - 1]);
  }
  function calcRun(c) {
    var g = function (k) { return c.querySelector('[data-cc="' + k + '"]'); }, t = parseFloat(g('t').value), el = parseFloat(g('e').value), o = g('o');
    var alts = String(g('a').value || '').split(/[,\s]+/).map(Number).filter(function (x) { return x > 0; });
    if (isNaN(t) || isNaN(el) || !alts.length) { o.innerHTML = ''; return; }
    if (t > 0) { o.innerHTML = '<p class="cw-sm">' + TX('c_warm') + '</p>'; return; }
    var T = Math.max(-50, -10 * Math.ceil(-t / 10)); if (t < -50) T = -50;
    o.innerHTML = (t < -50 ? '<p class="cw-amb">Below -50 °C is outside the table.</p>' : '') + '<table class="cw-t"><thead><tr><th>Published</th><th>Height above source</th><th>Correction (row ' + T + ' °C)</th><th>Corrected</th></tr></thead><tbody>' +
      alts.map(function (a) { var h = a - el; if (h <= 0) return '<tr><td>' + a + '</td><td colspan="3">below the reference</td></tr>'; var cr = Math.round(corrFor(T, h));
        return '<tr><td>' + a + '</td><td>' + Math.round(h) + '</td><td>' + cr + (cr < 100 ? ' <small>' + TX('c_fmc') + '</small>' : '') + '</td><td><b>' + (a + cr) + '</b></td></tr>'; }).join('') +
      '</tbody></table><p class="cw-sm">' + TX('c_note') + '</p>';
  }
  /* ---------- NOW card */
  function nowCard() {
    var sec = $('v-now'); if (!sec || !LIB) return; var old = $('cw-now'); if (old) old.remove();
    var lv = Math.max((LV.dep || {}).lv || 0, (LV.arr || {}).lv || 0);
    var d = document.createElement('details'); d.id = 'cw-now'; d.className = 'cw-nowc' + (lv === 2 ? ' cw-hot' : (lv === 1 ? ' cw-warm' : ''));
    d.innerHTML = '<summary>❄ Icing – in-flight procedure<small>' + (lv === 2 ? 'icing conditions / cold weather at ' + [LV.dep, LV.arr].filter(function (l) { return l && l.lv === 2; }).map(function (l) { return l.icao; }).join(' / ') : 'engine / wing anti-ice · ice accretion speeds · ECAM · fuel temperature') + '</small></summary><div class="cw-pane">' + LIB.html.now + '</div>';
    var strip = $('nowstrip'); if (strip && strip.parentNode === sec) strip.insertAdjacentElement('afterend', d); else sec.appendChild(d);
  }
  /* ---------- live countdowns in the worksheet */
  setInterval(function () {
    document.querySelectorAll('[data-cwcd]').forEach(function (e) { if (e.offsetParent === null) return; var left = (+e.dataset.cwcd - Date.now()) / 1000; e.textContent = left > 0 ? 'in ' + mmss(left) : 'EXPIRED ' + mmss(left) + ' ago';
      var x = e.closest('.cw-x'); if (x) { x.classList.toggle('exp', left <= 0); x.classList.toggle('soon', left > 0 && left <= 300); } });
  }, 1000);
  return { setLib: setLib, init: init, has: has, badge: badge, icing: icing, label: label, cls: cls, render: render, lib: function () { return LIB; }, _assess: assess };
})();
