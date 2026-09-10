// PrepModule — the request form (/request/, /ko/request/) and the four S01 states:
// input error · sending · received · failed. Success is shown only after the request was actually accepted.
// One form, three services (admissions / sat / ap). The service decides which fields show and which experts are offered.
// Text produced here comes from PM.i18n[lang] (data.js); everything static is in the page itself.
(function () {
  var form = document.getElementById('form'); if (!form || !window.PM) return;
  var D = window.PM, q = new URLSearchParams(location.search);
  var lang = document.documentElement.lang === 'ko' ? 'ko' : 'en';
  var T = (D.i18n && D.i18n[lang]) || D.i18n.en;
  var $ = function (id) { return document.getElementById(id); };
  var notice = $('paramNotice'), notes = [];
  var demo = q.get('demo');
  var SERVICES = ['admissions', 'sat', 'ap'];
  var lroot = form.getAttribute('data-lroot') || '../';
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function L(item, f) { f = f || 'label'; return (lang === 'ko' && item[f + '_ko']) ? item[f + '_ko'] : (item[f] || item.name || ''); }

  function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }
  function fill(sel, items, placeholder) {
    sel.innerHTML = ''; sel.appendChild(opt('', placeholder));
    var groups = {};
    items.forEach(function (i) {
      var g = L(i, 'group');
      if (!i.group) { sel.appendChild(opt(i.id, L(i))); return; }
      if (!groups[g]) { groups[g] = document.createElement('optgroup'); groups[g].label = g; sel.appendChild(groups[g]); }
      groups[g].appendChild(opt(i.id, L(i)));
    });
  }
  function has(items, id) { return items.some(function (i) { return i.id === id; }); }
  function label(items, id) { var f = items.filter(function (i) { return i.id === id; })[0]; return f ? (f.name ? L(f, 'name') : L(f)) : ''; }
  function meta(items, id) { var f = items.filter(function (i) { return i.id === id; })[0]; return f ? L(f, 'meta') : ''; }

  // ---- shared fields ----
  fill($('grade'), D.grades, T.selectGrade);
  var tz = $('timezone'), zones = D.timeZones;
  try { if (Intl.supportedValuesOf) zones = Intl.supportedValuesOf('timeZone'); } catch (e) {}
  var mine = ''; try { mine = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  fill(tz, zones.map(function (z) { return { id: z, label: z.replace(/_/g, ' ') }; }), T.chooseTz);
  if (zones.indexOf(mine) > -1) tz.value = mine;

  // ---- service, area / subject, expert ----
  var radios = form.querySelectorAll('input[name="service"]'), area = $('area'), ap = $('apSubject'), ex = $('expertId');
  fill(area, D.satAreas, T.chooseArea);
  fill(ap, D.apSubjects, T.chooseAp);
  function service() { var r = form.querySelector('input[name="service"]:checked'); return r ? r.value : ''; }
  function detail() { var s = service(); return s === 'sat' ? area.value : s === 'ap' ? ap.value : ''; }

  // Prefill from the landing's URL — ids only (spec p.12). ?service=admissions or ?subject=sat|ap, plus area / apSubject / expertId.
  var s = q.get('service') || q.get('subject');
  if (s && SERVICES.indexOf(s) === -1) { notes.push(fmt(T.noticeService, { v: s })); s = null; }
  if (s) form.querySelector('input[name="service"][value="' + s + '"]').checked = true;
  var a = q.get('area');
  if (a) { if (has(D.satAreas, a)) area.value = a; else notes.push(fmt(T.noticeArea, { v: a })); }
  var p = q.get('apSubject');
  if (p) { if (has(D.apSubjects, p)) ap.value = p; else notes.push(fmt(T.noticeAp, { v: p })); }

  var sel = $('selection');
  function row(k, v, href) { return '<div class="item"><span class="k">' + k + '</span><span class="v">' + v + (href ? ' <a href="' + href + '">' + T.change + '</a>' : '') + '</span></div>'; }
  function expertLabelFor(s) { return s === 'admissions' ? T.labelExpertAdm : T.labelExpertTut; }
  function backFor(s, d) {
    return s === 'admissions' ? lroot + 'admissions/#experts'
      : s === 'sat' ? lroot + 'tutoring/sat/' + (d ? '?area=' + d : '')
      : s === 'ap' ? lroot + 'tutoring/ap/' + (d ? '?apSubject=' + d : '')
      : lroot + '#support';
  }
  function renderSel() {
    var s = service(), d = detail();
    var who = ex.value ? (s === 'admissions' ? label(D.officers, ex.value) : label(D.tutors, ex.value) + ' (' + meta(D.tutors, ex.value) + ')') : (s === 'admissions' ? T.notSure : T.noneYet);
    sel.innerHTML = row(T.rowService, s ? T.names[s] : T.notChosen, backFor(s, d)) +
      (s === 'sat' ? row(T.rowArea, d ? label(D.satAreas, d) : T.notChosen) : '') +
      (s === 'ap' ? row(T.rowAp, d ? label(D.apSubjects, d) : T.notChosen) : '') +
      (s ? row(expertLabelFor(s), who) : '');
    var back = $('doneBack'); if (back) back.setAttribute('href', s === 'admissions' ? lroot + 'admissions/' : s === 'sat' ? lroot + 'tutoring/sat/' : s === 'ap' ? lroot + 'tutoring/ap/' : lroot);
  }

  // Spec p.12: when the service / area / subject change, values that no longer fit are cleared — including the chosen expert.
  function sync() {
    var s = service(), d = detail();
    $('areaField').hidden = s !== 'sat'; $('apField').hidden = s !== 'ap'; $('expertField').hidden = !s;
    if (s !== 'sat') area.value = ''; if (s !== 'ap') ap.value = '';
    var list, placeholder;
    if (s === 'admissions') {
      list = D.officers.map(function (o) { return { id: o.id, label: L(o, 'name') + ' — ' + L(o, 'meta') }; }); placeholder = T.expertAdm;
    } else if (s) {
      var open = !d || d === 'both' || d === 'unsure' || d === 'other';
      list = D.tutors.filter(function (t) { return t.subject === s && (open || t.match.indexOf(d) > -1); })
        .map(function (t) { return { id: t.id, label: L(t, 'name') + ' — ' + L(t, 'meta') }; });
      placeholder = T.expertTut;
    } else { list = []; placeholder = T.expertNone; }
    var cur = ex.value; fill(ex, list, placeholder); ex.disabled = !s;
    if (cur && list.some(function (i) { return i.id === cur; })) ex.value = cur;
    $('expertLabel').textContent = expertLabelFor(s);
    $('expertHelp').textContent = s === 'admissions' ? T.helpExpertAdm : T.helpExpertTut;
    $('messageHelp').textContent = s === 'admissions' ? T.helpMsgAdm : s ? T.helpMsgTut : T.helpMsgNone;
    Array.prototype.forEach.call(document.querySelectorAll('.nav-links a[data-service]'), function (l) {
      if (l.getAttribute('data-service') === s) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    renderSel();
  }
  Array.prototype.forEach.call(radios, function (r) { r.addEventListener('change', sync); });
  area.addEventListener('change', sync); ap.addEventListener('change', sync); ex.addEventListener('change', renderSel);
  sync();
  var e = q.get('expertId');
  if (e) {
    if (Array.prototype.some.call(ex.options, function (o) { return o.value === e; })) { ex.value = e; renderSel(); }
    else notes.push(fmt(T.noticeExpert, { v: e }));
  }
  if (notes.length && notice) { notice.querySelector('[data-text]').innerHTML = notes.map(function (n) { return '<p>' + n + '</p>'; }).join(''); notice.hidden = false; }

  // ---- S01-01 input errors: message next to the field, values kept ----
  var attempted = false;
  function validate(focusFirst) {
    var ok = true, first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[data-required]'), function (f) {
      if (f.hidden) { f.classList.remove('invalid'); return; }
      var input = f.querySelector('input, select, textarea'), bad, msg = f.getAttribute('data-msg') || T.required;
      if (input.type === 'checkbox') bad = !input.checked;
      else if (input.type === 'radio') bad = !form.querySelector('input[name="' + input.name + '"]:checked');
      else bad = !input.value.trim();
      if (!bad && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { bad = true; msg = T.emailMsg; }
      f.classList.toggle('invalid', bad);
      var err = f.querySelector('.err'); if (err) err.textContent = bad ? msg : '';
      if (input.type !== 'radio') input.setAttribute('aria-invalid', String(bad));
      if (bad) { ok = false; if (!first) first = input; }
    });
    var count = $('errCount');
    if (count) { var n = form.querySelectorAll('.invalid').length; count.hidden = ok; count.textContent = n ? (n === 1 ? T.errOne : fmt(T.errMany, { n: n })) : ''; }
    if (!ok && focusFirst && first) first.focus();
    return ok;
  }
  form.addEventListener('input', function () { if (attempted) validate(false); });
  form.addEventListener('change', function () { if (attempted) validate(false); });

  // ---- S01-02 sending · S01-03 received · S01-04 failed ----
  var btn = $('submitBtn'), fail = $('failBanner'), done = $('done');
  function setSending(on) { btn.disabled = on; btn.setAttribute('aria-busy', String(on)); btn.textContent = on ? T.sending : btn.getAttribute('data-label'); }
  function build() {
    var f = new FormData(form), o = { sentAt: new Date().toISOString(), lang: lang };
    f.forEach(function (v, k) { if (k !== 'website') o[k] = typeof v === 'string' ? v.trim() : v; });
    o.form = o.service === 'admissions' ? 'admissions' : 'tutoring';
    if (o.service === 'sat' || o.service === 'ap') o.subject = o.service;
    o.consent = !!form.consent.checked;
    // Campaign / product identifiers only — never the message or contact details (spec p.10)
    var utm = {}; q.forEach(function (v, k) { if (/^utm_/i.test(k)) utm[k] = v; });
    o.source = { path: location.pathname, referrer: document.referrer ? document.referrer.split('?')[0] : '', utm: utm, fbclid: q.get('fbclid') || '', gclid: q.get('gclid') || '' };
    return o;
  }
  function send(payload) {
    if (demo) return new Promise(function (res, rej) { setTimeout(function () { demo === 'ok' ? res() : rej(new Error('demo')); }, 900); });
    if (!D.submit.endpoint) return Promise.reject(new Error('not-connected'));
    return fetch(D.submit.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('http-' + r.status); });
  }
  function showFail(err) {
    setSending(false);
    var notConnected = err && err.message === 'not-connected';
    fail.querySelector('[data-text]').textContent = fmt(notConnected ? T.failNotConnected : T.failGeneric, { contact: D.contact });
    fail.hidden = false; fail.focus();
  }
  function showDone(payload) {
    done.querySelector('[data-email]').textContent = payload.email;
    var facts = done.querySelector('[data-facts]'); facts.innerHTML = '';
    var s = payload.service, items = [[T.rowService, T.names[s]]];
    if (s === 'sat') items.push([T.rowArea, label(D.satAreas, payload.area)]);
    if (s === 'ap') items.push([T.rowAp, label(D.apSubjects, payload.apSubject)]);
    items.push([expertLabelFor(s), payload.expertId ? (s === 'admissions' ? label(D.officers, payload.expertId) : label(D.tutors, payload.expertId)) : (s === 'admissions' ? T.doneExpertAdm : T.doneExpertTut)]);
    items.forEach(function (i) { var li = document.createElement('li'); li.innerHTML = '<span class="k">' + i[0] + '</span><span>' + i[1] + '</span>'; facts.appendChild(li); });
    form.hidden = true; if (notice) notice.hidden = true;
    var aside = document.querySelector('.rail'); if (aside) aside.hidden = true;
    done.hidden = false; done.focus(); done.scrollIntoView({ block: 'start' });
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); attempted = true; fail.hidden = true;
    if (!validate(true)) return;
    if (form.website && form.website.value) return;           // honeypot: bots fill it, people never see it
    setSending(true);
    var payload = build();
    send(payload).then(function () { showDone(payload); }, function (err) { showFail(err); });
  });

  // Demo mode (?demo=ok|fail): the transport is simulated and a tag says so. Add &auto=1 to fill sample values and
  // submit at once — a one-click preview of the received / failed states. Never used by real visitors.
  if (demo) {
    var d = $('demoTag'); if (d) d.hidden = false;
    if (q.get('auto') === '1') {
      var demoFill = function (id, v) { var el = $(id); if (el && !el.value) el.value = v; };
      if (!service()) { form.querySelector('input[name="service"][value="sat"]').checked = true; sync(); }
      if (service() === 'sat' && !area.value) { area.value = 'rw'; sync(); }
      if (service() === 'ap' && !ap.value) { ap.value = 'calculus-ab'; sync(); }
      demoFill('name', 'Demo Student'); demoFill('email', 'demo@example.com'); demoFill('grade', 'g11');
      demoFill('message', 'Demo request — this text is sample content and nothing is sent.');
      form.consent.checked = true;
      form.requestSubmit ? form.requestSubmit() : btn.click();
    }
  }
})();
