/* fp_brief.js v1.1 (17 NOV 26) - DEP / ARR page tabs: the pack card, the pilot's own briefing picture, and (v1.1) the ❄ Icing tab (FPCold).
   v1.0 (16 NOV 26) - "Briefing" tab with the briefing picture (pilot request). The pictures come in Claude's flight files (data.brief.dep / .arr)
   and the iPad keeps the last ones ('fp.brief.def'), so they never sit in the public app code. Picture only: no ticks, no text. */
window.FPBrief = (function () {
  'use strict';
  var B = null, KEY = 'fp.brief.def', NAME = { dep: 'Departure briefing', arr: 'Arrival briefing' }, MAIN = { dep: 'Departure card', arr: 'Arrival card' }, cur = {};
  function init(D) {
    try {
      if (D && D.brief && (D.brief.dep || D.brief.arr)) { B = { dep: D.brief.dep || null, arr: D.brief.arr || null }; localStorage.setItem(KEY, JSON.stringify(B)); }
      else B = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) { B = B || null; }
    ['dep', 'arr'].forEach(inject);
  }
  function cold(k) { return !!(window.FPCold && window.FPCold.has(k)); }
  function inject(k) {
    if (k !== 'dep' && k !== 'arr') return;
    var pic = !!(B && B[k]), ic = cold(k); if (!pic && !ic) return;
    var sec = document.getElementById('v-' + k); if (!sec || sec.hasAttribute('data-lazy') || sec.querySelector(':scope > .brf-tabs')) return;
    var card = document.createElement('div'); card.className = 'brf-card';
    while (sec.firstChild) card.appendChild(sec.firstChild);
    var tabs = document.createElement('div'); tabs.className = 'gtabs brf-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" role="tab" data-bt="card">' + MAIN[k] + '</button>' + (pic ? '<button type="button" role="tab" data-bt="brief">' + NAME[k] + '</button>' : '') +
      (ic ? '<button type="button" role="tab" data-bt="cold" class="' + window.FPCold.cls(k) + '">' + window.FPCold.label(k) + '</button>' : '');
    sec.appendChild(tabs); sec.appendChild(card);
    if (pic) { var p = document.createElement('div'); p.className = 'brf-pic'; p.hidden = true; p.innerHTML = '<img src="' + B[k] + '" alt="' + NAME[k] + '">'; sec.appendChild(p); }
    if (ic) { var c = document.createElement('div'); c.className = 'brf-cold'; c.hidden = true; sec.appendChild(c); }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-bt]'); if (b) show(k, b.dataset.bt); });
    show(k, cur[k] || 'card');
  }
  function show(k, t) {
    var sec = document.getElementById('v-' + k); if (!sec) return;
    var panes = { card: sec.querySelector(':scope > .brf-card'), brief: sec.querySelector(':scope > .brf-pic'), cold: sec.querySelector(':scope > .brf-cold') };
    if (!panes[t]) t = 'card'; if (!panes.card) return; cur[k] = t;
    if (t === 'cold' && !panes.cold._done) { panes.cold._done = 1; window.FPCold.render(k, panes.cold); }
    Object.keys(panes).forEach(function (p) { if (panes[p]) panes[p].hidden = p !== t; });
    sec.querySelectorAll(':scope > .sj, :scope > .brfbar').forEach(function (x) { x.classList.toggle('brf-off', t !== 'card'); });   // the card's own section bar / briefed button only with the card
    sec.querySelectorAll(':scope > .brf-tabs [data-bt]').forEach(function (b) { var o = b.dataset.bt === t; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
    if (t !== 'card') window.scrollTo(0, 0);
  }
  return { init: init, inject: inject, show: show };
})();
