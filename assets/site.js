// PrepModule — shared behaviour. Every block guards for its elements, so pages include only what they use.

// Language: the switch links to the same page in the other language and keeps the query string + hash.
// On English pages, a Korean-language browser gets a one-line offer once; either click records the choice.
(function () {
  var qs = location.search + location.hash, chosen = null;
  try { chosen = localStorage.getItem('pm-lang'); } catch (e) {}
  Array.prototype.forEach.call(document.querySelectorAll('a[data-lang-switch]'), function (a) {
    a.setAttribute('href', a.getAttribute('href').split('?')[0] + qs);
    a.addEventListener('click', function () { try { localStorage.setItem('pm-lang', a.getAttribute('data-lang-switch')); } catch (e) {} });
  });
  var banner = document.getElementById('langBanner'); if (!banner) return;
  var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
  var wantsKo = langs.some(function (l) { return /^ko\b/i.test(l); });
  var header = document.getElementById('nav');
  function syncNavH() { if (header) document.documentElement.style.setProperty('--nav-h', header.offsetHeight + 'px'); }
  var force = new URLSearchParams(location.search).get('banner') === '1';   // preview hook, like ?demo
  if (document.documentElement.lang === 'en' && ((wantsKo && chosen !== 'en') || force)) { banner.hidden = false; syncNavH(); window.addEventListener('resize', syncNavH); }
  var x = banner.querySelector('[data-dismiss]');
  if (x) x.addEventListener('click', function () { banner.hidden = true; document.documentElement.style.removeProperty('--nav-h'); try { localStorage.setItem('pm-lang', 'en'); } catch (e) {} });
})();

// Nav: dark while the hero is under it, light afterwards
(function () {
  var nav = document.getElementById('nav'), hero = document.getElementById('hero');
  if (!nav) return;
  if (!hero || !('IntersectionObserver' in window)) { nav.classList.add('light'); return; }
  new IntersectionObserver(function (entries) {
    nav.classList.toggle('light', !entries[0].isIntersecting);
  }, { rootMargin: '-' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64) + 'px 0px 0px 0px', threshold: 0 }).observe(hero);
})();

// Scroll reveal (skipped when the user prefers reduced motion)
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); }); return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

// Mobile menu
(function () {
  var btn = document.getElementById('menuBtn'), list = document.getElementById('navLinks');
  if (!btn || !list) return;
  btn.addEventListener('click', function () {
    var open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  list.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { list.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });
})();

// Tabs — click + arrow keys, aria kept in sync
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) { p.hidden = !on; if (on) p.classList.add('in'); }
    });
    tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]);
      }
    });
  });
})();

// Campaign identifiers (utm_*, fbclid, gclid) ride along from a landing to the request forms.
// Product and campaign ids only — never names, emails, or messages (spec p.10 / p.12). Runs before the picker so it sees them.
(function () {
  var q = new URLSearchParams(location.search), keep = new URLSearchParams();
  q.forEach(function (v, k) { if (/^utm_/i.test(k) || k === 'fbclid' || k === 'gclid') keep.set(k, v); });
  if (!keep.toString()) return;
  Array.prototype.forEach.call(document.querySelectorAll('a[href*="request/"]'), function (a) {
    var parts = a.getAttribute('href').split('?'), p = new URLSearchParams(parts[1] || '');
    keep.forEach(function (v, k) { if (!p.has(k)) p.set(k, v); });
    a.setAttribute('href', parts[0] + '?' + p.toString());
  });
})();

// Subject / area picker (P02 area, P03 apSubject): one choice kept in the URL, on every [data-carry] request link,
// on matching .profile[data-match] cards, and in every [data-pick-label]. Invalid URL values are cleared with a notice;
// a choice with no public profile shows #pickEmpty instead of a blank list (spec 12 / P4).
(function () {
  var root = document.querySelector('[data-picker]'); if (!root) return;
  var param = root.getAttribute('data-picker');
  var options = Array.prototype.slice.call(document.querySelectorAll('[data-option]'));
  var select = document.querySelector('select[data-picker-select]');
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-carry]'));
  var profiles = Array.prototype.slice.call(document.querySelectorAll('.profile[data-match]'));
  var status = document.getElementById('pickStatus'), empty = document.getElementById('pickEmpty'), notice = document.getElementById('pickNotice');
  var labels = {};
  options.forEach(function (o) { labels[o.getAttribute('data-option')] = o.getAttribute('data-label') || o.textContent.trim(); });
  if (select) Array.prototype.forEach.call(select.options, function (o) { if (o.value) labels[o.value] = o.textContent.trim(); });

  function apply(v) {
    options.forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-option') === v)); });
    if (select) select.value = v || '';
    links.forEach(function (a) {
      var base = a.getAttribute('data-href') || a.getAttribute('href'); a.setAttribute('data-href', base);
      var parts = base.split('?'), p = new URLSearchParams(parts[1] || '');
      if (v) p.set(param, v); else p.delete(param);
      a.setAttribute('href', parts[0] + (p.toString() ? '?' + p.toString() : ''));
    });
    var matches = [];
    profiles.forEach(function (pr) {
      var ok = !v || (' ' + pr.getAttribute('data-match') + ' ').indexOf(' ' + v + ' ') > -1;
      pr.classList.toggle('dim', !ok);
      if (ok && v) matches.push(pr.getAttribute('data-name') || '');
    });
    if (status) {
      var tpl = v ? status.getAttribute(matches.length ? 'data-for' : 'data-none') : status.getAttribute('data-all');
      status.firstChild.textContent = (tpl || '').replace('{label}', labels[v] || '');
    }
    if (empty) empty.hidden = !(v && matches.length === 0);
    if (notice && v) notice.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('[data-pick-label]'), function (el) { el.textContent = v ? labels[v] : el.getAttribute('data-pick-label'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-for]'), function (el) {
      var f = el.getAttribute('data-for');
      el.hidden = v ? (' ' + f + ' ').indexOf(' ' + v + ' ') === -1 : f !== '*';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-names]'), function (el) { el.textContent = matches.length ? matches.join(' · ') : '—'; });
    var u = new URL(location.href); if (v) u.searchParams.set(param, v); else u.searchParams.delete(param);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  options.forEach(function (o) { o.addEventListener('click', function () { apply(o.getAttribute('aria-pressed') === 'true' ? null : o.getAttribute('data-option')); }); });
  if (select) select.addEventListener('change', function () { apply(select.value || null); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-pick-clear]'), function (b) { b.addEventListener('click', function () { apply(null); }); });

  var initial = new URLSearchParams(location.search).get(param);
  if (initial && !labels.hasOwnProperty(initial)) {
    if (notice) { notice.hidden = false; notice.querySelector('[data-bad]').textContent = initial; }
    initial = null;
  }
  apply(initial);
})();

// Expert detail: #expert-{id} opens that profile's biography and scrolls it clear of the header
(function () {
  function openFromHash() {
    var id = location.hash.slice(1); if (!id) return;
    var el = document.getElementById(id); if (!el || !el.classList.contains('profile')) return;
    var d = el.querySelector('details'); if (d) d.open = true;
    el.classList.add('in');
    requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
  }
  window.addEventListener('hashchange', openFromHash);
  if (document.readyState === 'complete') openFromHash(); else window.addEventListener('load', openFromHash);
})();

// Design A / B switch — a small pill in the corner. The choice is kept in localStorage ('pm-theme') and
// can be linked with ?theme=a|b; the head script applies it before first paint.
(function () {
  var d = document.documentElement, ko = d.lang === 'ko';
  var box = document.createElement('div');
  box.className = 'theme-switch'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', ko ? '디자인 선택' : 'Choose design');
  box.innerHTML = '<span class="lbl">' + (ko ? '디자인' : 'Design') + '</span><button type="button" data-t="a">A</button><button type="button" data-t="b">B</button>';
  function sync() { Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === (d.dataset.theme || 'a'))); }); }
  box.addEventListener('click', function (e) {
    var t = e.target.getAttribute && e.target.getAttribute('data-t'); if (!t) return;
    d.dataset.theme = t; sync();
    try { localStorage.setItem('pm-theme', t); } catch (err) {}
    var u = new URL(location.href); if (u.searchParams.has('theme')) { u.searchParams.set('theme', t); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    Array.prototype.forEach.call(document.querySelectorAll('a[data-lang-switch]'), function (a) { a.setAttribute('href', a.getAttribute('href').replace(/([?&]theme=)[ab]/, '$1' + t)); });
  });
  sync(); document.body.appendChild(box);
})();
