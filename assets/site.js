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

// Nav: dark while the hero is under it, light afterwards (a light hero keeps it light throughout)
(function () {
  var nav = document.getElementById('nav'), hero = document.getElementById('hero');
  if (!nav) return;
  if (!hero || hero.classList.contains('hero--light') || !('IntersectionObserver' in window)) { nav.classList.add('light'); return; }
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
    if (v && !matches.length) profiles.forEach(function (pr) { pr.classList.remove('dim'); });
    if (status) {
      var tpl = v ? status.getAttribute(matches.length ? 'data-for' : 'data-none') : status.getAttribute('data-all');
      status.firstChild.textContent = (tpl || '').replace('{label}', labels[v] || '');
      status.classList.toggle('no-match', !!(v && !matches.length));
    }
    if (empty) empty.hidden = !(v && matches.length === 0);
    if (notice && v) notice.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('[data-pick-label]'), function (el) { el.textContent = v ? labels[v] : el.getAttribute('data-pick-label'); });
    Array.prototype.forEach.call(document.querySelectorAll('.blurb[data-for]'), function (el) {
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
    if (notice) { notice.hidden = false; var bad = notice.querySelector('[data-bad]'); if (bad) bad.textContent = initial; }
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


// Experts carousel (home): a looping, centred carousel. Three cards per view on desktop (two on tablets, one with peeks on phones),
// the middle card in focus. It starts on the card named by data-start (N. G., Harvard) and advances on its own every few seconds
// while it is on screen; hovering, focusing inside it or a hidden tab pauses it, and reduced motion turns autoplay off.
(function () {
  var car = document.querySelector('[data-xcar]'); if (!car) return;
  var list = car.querySelector('.xlist'), orig = Array.prototype.slice.call(list.children), n = orig.length; if (n < 2) return;
  var prev = document.querySelector('[data-xcar-prev]'), next = document.querySelector('[data-xcar-next]'), dotsBox = document.querySelector('[data-xcar-dots]');
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  // one copy of the set on each side, so the row can loop without a jump the visitor can see
  function clone(li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('a, button').forEach(function (el) { el.setAttribute('tabindex', '-1'); }); return c; }
  orig.slice().reverse().forEach(function (li) { list.insertBefore(clone(li), list.firstChild); });
  orig.forEach(function (li) { list.appendChild(clone(li)); });
  var items = list.children, start = Math.min(n - 1, Math.max(0, parseInt(car.getAttribute('data-start'), 10) || 0)), idx = n + start;
  var dots = [];
  if (dotsBox) orig.forEach(function (li, k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'xdot';
    var h = li.querySelector('h3'); b.setAttribute('aria-label', h ? h.textContent : String(k + 1));
    b.addEventListener('click', function () { normalize(); idx = n + k; render(true); restart(); });
    dotsBox.appendChild(b); dots.push(b);
  });
  car.classList.add('is-on');
  function per(w) { return w >= 980 ? 3 : w >= 620 ? 2 : 1.18; }
  function render(anim) {
    var cs = getComputedStyle(car), w = car.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), p = per(w), gap = parseFloat(getComputedStyle(list).columnGap) || 24;
    var cw = p >= 2 ? (w - gap * (Math.ceil(p) - 1)) / Math.ceil(p) : w / p;
    if (p === 2) cw = (w - gap) / 2;   // tablets: the middle card centred, half of each neighbour showing
    list.style.setProperty('--cw', cw + 'px');
    var x = (w - cw) / 2 - idx * (cw + gap);
    if (!anim) car.classList.add('no-anim');
    list.style.transform = 'translate3d(' + x + 'px,0,0)';
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-center', i === idx);
    var real = ((idx - n) % n + n) % n;
    dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === real)); });
    if (!anim) { void list.offsetWidth; car.classList.remove('no-anim'); }
  }
  // after a move lands on a copy, jump (without animation) to the same card in the middle set
  function normalize() { if (idx < n || idx >= 2 * n) { idx = n + ((idx - n) % n + n) % n; render(false); } }
  list.addEventListener('transitionend', function (e) { if (e.target === list && e.propertyName === 'transform') normalize(); });
  function go(d) { if (idx + d < 1 || idx + d > 3 * n - 2) normalize(); idx += d; render(!reduce.matches); }
  if (prev) prev.addEventListener('click', function () { go(-1); restart(); });
  if (next) next.addEventListener('click', function () { go(1); restart(); });
  // a click on a side card brings it to the middle instead of following its link
  list.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li || li.classList.contains('is-center')) return;
    e.preventDefault(); var i = Array.prototype.indexOf.call(items, li); if (i < 0) return;
    go(i - idx); restart();
  });
  car.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(1); restart(); } if (e.key === 'ArrowLeft') { go(-1); restart(); } });
  // swipe on touch screens (vertical scrolling still works: touch-action pan-y)
  var sx = null, sy = null;
  car.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
  car.addEventListener('pointerup', function (e) {
    if (sx === null) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); restart(); }
  });
  car.addEventListener('pointercancel', function () { sx = null; });
  // autoplay
  var timer = null, visible = false, hold = false;
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); if (!reduce.matches && visible && !hold && !document.hidden) timer = setInterval(function () { go(1); }, 4500); }
  car.addEventListener('mouseenter', function () { hold = true; stop(); });
  car.addEventListener('mouseleave', function () { hold = false; restart(); });
  car.addEventListener('focusin', function () { hold = true; stop(); });
  car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) { hold = false; restart(); } });
  document.addEventListener('visibilitychange', restart);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(car);
  else { visible = true; }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { render(false); }, 80); });
  render(false); restart();
})();

// University rows (home): repeat each list until half the row is wider than the screen, then double it so a -50% slide loops seamlessly.
// Without JavaScript, or with reduced motion, the names simply sit centred.
(function () {
  var rows = document.querySelectorAll('[data-marquee]'); if (!rows.length) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function build(m) {
    var track = m.querySelector('.marquee-track'), list = track.querySelector('ul'); if (!list) return;
    track.querySelectorAll('[data-copy]').forEach(function (c) { c.remove(); });
    m.classList.add('is-on');
    var w = list.getBoundingClientRect().width; if (!w) { m.classList.remove('is-on'); return; }
    var half = Math.max(1, Math.ceil((m.clientWidth + 1) / w));
    for (var i = 1; i < half * 2; i++) { var c = list.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-copy', ''); track.appendChild(c); }
    track.style.setProperty('--dur', Math.round(half * w / 38) + 's');   // about 38px a second
  }
  rows.forEach(build);
  var lastW = window.innerWidth, rt;
  window.addEventListener('resize', function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rt); rt = setTimeout(function () { rows.forEach(build); }, 120); });
})();

// Floating chat buttons — KakaoTalk and WhatsApp, bottom right on every page.
// Fill in the two values below; until then the buttons show and say the link is coming soon.
(function () {
  var CHAT = {
    kakao: '',     // KakaoTalk channel chat link, e.g. 'https://pf.kakao.com/_AbCdE/chat'
    whatsapp: '821024771661'   // WhatsApp number, international format, digits only, e.g. '821012345678'
  };
  var ko = document.documentElement.lang === 'ko';
  var t = ko
    ? { group: '채팅 문의', kakao: '카카오톡 문의', wa: 'WhatsApp 문의', soon: ' — 곧 연결돼요', hello: '안녕하세요, PrepModule 문의드려요.' }
    : { group: 'Chat with us', kakao: 'Chat on KakaoTalk', wa: 'Chat on WhatsApp', soon: ' — link coming soon', hello: 'Hi, I have a question about PrepModule.' };
  var waHref = CHAT.whatsapp ? 'https://wa.me/' + CHAT.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(t.hello) : '';
  var icons = {
    kakao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#191919" d="M12 3.6c-5.3 0-9.6 3.36-9.6 7.5 0 2.68 1.8 5.03 4.5 6.36l-.96 3.5c-.08.3.26.55.53.37l4.17-2.76c.44.05.9.08 1.36.08 5.3 0 9.6-3.36 9.6-7.5S17.3 3.6 12 3.6z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z"/></svg>'
  };
  function btn(cls, href, label, icon) {
    var a = document.createElement('a');
    a.className = 'fab ' + cls; a.innerHTML = icon + '<span class="fab-label">' + label + (href ? '' : t.soon) + '</span>';
    a.setAttribute('aria-label', label + (href ? '' : t.soon));
    if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.href = '#'; a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', function (e) { e.preventDefault(); }); }
    return a;
  }
  var box = document.createElement('div');
  box.className = 'chat-fab'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', t.group);
  box.appendChild(btn('kakao', CHAT.kakao, t.kakao, icons.kakao));
  box.appendChild(btn('whatsapp', waHref, t.wa, icons.wa));
  document.body.appendChild(box);
})();

// Admissions timeline: pick the current grade; graduation year and term labels are computed from today's date.
// School year runs Aug–Jul. The first visible card is "now" for that grade.
(function () {
  var root = document.getElementById('admTimeline'); if (!root) return;
  var d = new Date(), y = d.getFullYear(), fall = d.getMonth() >= 7;
  var A = function (k) { return root.getAttribute('data-' + k) || ''; };
  var fmt = function (s, o) { return s.replace(/\{(\w)\}/g, function (_, k) { return o[k]; }); };
  var btns = Array.prototype.slice.call(root.querySelectorAll('.tl-g')), items = Array.prototype.slice.call(root.querySelectorAll('.tl-item'));
  function classOf(g) { return y + (12 - g) + (fall ? 1 : 0); }
  var startFor = { 9: 0, 10: 1, 11: fall ? 3 : 4, 12: fall ? 6 : 7 };
  btns.forEach(function (b) {
    var g = +b.getAttribute('data-grade');
    b.querySelector('b').textContent = fmt(A('g'), { g: g });
    b.querySelector('small').textContent = fmt(A('class'), { c: classOf(g) });
  });
  function show(g) {
    var C = classOf(g), start = startFor[g];
    var when = [fmt(A('year'), { a: C - 4, b: C - 3 }), fmt(A('year'), { a: C - 3, b: C - 2 }), fmt(A('summer'), { y: C - 2 }), fmt(A('fall'), { y: C - 2 }),
                fmt(A('spring'), { y: C - 1 }), fmt(A('summer'), { y: C - 1 }), fmt(A('fall'), { y: C - 1 }), fmt(A('spring'), { y: C })];
    items.forEach(function (it, i) {
      it.hidden = i < start;
      it.classList.toggle('is-now', i === start);
      it.querySelector('.w').textContent = when[i];
    });
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-grade') === g)); });
    var track = root.querySelector('.tl'); if (track) track.scrollLeft = 0;
  }
  btns.forEach(function (b) { b.addEventListener('click', function () {
    var g = +b.getAttribute('data-grade'); show(g);
    var u = new URL(location.href); u.searchParams.set('grade', g); history.replaceState(null, '', u.pathname + u.search + u.hash);
  }); });
  var q = +new URLSearchParams(location.search).get('grade');
  show(startFor.hasOwnProperty(q) ? q : 11);
})();
