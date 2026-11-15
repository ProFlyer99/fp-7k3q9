/* fp_brief.js v1.0 (16 NOV 26) - DEP / ARR: a "Briefing" tab with the pilot's own briefing picture (pilot request 16 NOV 26).
   The pictures come in Claude's flight files (data.brief.dep / .arr) and the iPad keeps the last ones ('fp.brief.def'),
   so they never sit in the public app code. Picture only: no ticks, no text. */
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
  function inject(k) {
    if (!B || !B[k] || (k !== 'dep' && k !== 'arr')) return;
    var sec = document.getElementById('v-' + k); if (!sec || sec.hasAttribute('data-lazy') || sec.querySelector(':scope > .brf-tabs')) return;
    var card = document.createElement('div'); card.className = 'brf-card';
    while (sec.firstChild) card.appendChild(sec.firstChild);
    var tabs = document.createElement('div'); tabs.className = 'gtabs brf-tabs'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" role="tab" data-bt="card">' + MAIN[k] + '</button><button type="button" role="tab" data-bt="brief">' + NAME[k] + '</button>';
    var pic = document.createElement('div'); pic.className = 'brf-pic'; pic.hidden = true;
    pic.innerHTML = '<img src="' + B[k] + '" alt="' + NAME[k] + '">';
    sec.appendChild(tabs); sec.appendChild(card); sec.appendChild(pic);
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-bt]'); if (b) show(k, b.dataset.bt); });
    show(k, cur[k] || 'card');
  }
  function show(k, t) {
    var sec = document.getElementById('v-' + k); if (!sec) return; cur[k] = t;
    var card = sec.querySelector(':scope > .brf-card'), pic = sec.querySelector(':scope > .brf-pic'); if (!card || !pic) return;
    card.hidden = t === 'brief'; pic.hidden = t !== 'brief';
    sec.querySelectorAll(':scope > .brf-tabs [data-bt]').forEach(function (b) { var o = b.dataset.bt === t; b.classList.toggle('on', o); b.setAttribute('aria-selected', o ? 'true' : 'false'); });
    if (t === 'brief') window.scrollTo(0, 0);
  }
  return { init: init, inject: inject, show: show };
})();
