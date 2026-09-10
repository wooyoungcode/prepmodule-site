// PrepModule — the request form (/request/) and the four S01 states:
// input error · sending · received · failed. Success is shown only after the request was actually accepted.
// One form, three services (admissions / sat / ap). The service decides which fields show and which experts are offered.
(function () {
  var form = document.getElementById('form'); if (!form || !window.PM) return;
  var D = window.PM, q = new URLSearchParams(location.search);
  var $ = function (id) { return document.getElementById(id); };
  var notice = $('paramNotice'), notes = [];
  var demo = q.get('demo');
  var SERVICES = ['admissions', 'sat', 'ap'];
  var NAMES = { admissions: 'Admissions conversation', sat: 'SAT tutoring', ap: 'AP tutoring' };

  function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }
  function fill(sel, items, placeholder) {
    sel.innerHTML = ''; sel.appendChild(opt('', placeholder));
    var groups = {};
    items.forEach(function (i) {
      if (!i.group) { sel.appendChild(opt(i.id, i.label)); return; }
      if (!groups[i.group]) { groups[i.group] = document.createElement('optgroup'); groups[i.group].label = i.group; sel.appendChild(groups[i.group]); }
      groups[i.group].appendChild(opt(i.id, i.label));
    });
  }
  function has(items, id) { return items.some(function (i) { return i.id === id; }); }
  function label(items, id) { var f = items.filter(function (i) { return i.id === id; })[0]; return f ? (f.label || f.name) : ''; }

  // ---- shared fields ----
  fill($('grade'), D.grades, 'Select grade');
  var tz = $('timezone'), zones = D.timeZones;
  try { if (Intl.supportedValuesOf) zones = Intl.supportedValuesOf('timeZone'); } catch (e) {}
  var mine = ''; try { mine = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  fill(tz, zones.map(function (z) { return { id: z, label: z.replace(/_/g, ' ') }; }), 'Choose your time zone');
  if (zones.indexOf(mine) > -1) tz.value = mine;

  // ---- service, area / subject, expert ----
  var radios = form.querySelectorAll('input[name="service"]'), area = $('area'), ap = $('apSubject'), ex = $('expertId');
  fill(area, D.satAreas, 'Choose an area');
  fill(ap, D.apSubjects, 'Choose your AP subject');
  function service() { var r = form.querySelector('input[name="service"]:checked'); return r ? r.value : ''; }
  function detail() { var s = service(); return s === 'sat' ? area.value : s === 'ap' ? ap.value : ''; }

  // Prefill from the landing's URL — ids only (spec p.12). ?service=admissions or ?subject=sat|ap, plus area / apSubject / expertId.
  var s = q.get('service') || q.get('subject');
  if (s && SERVICES.indexOf(s) === -1) { notes.push('“' + s + '” isn’t a service we offer. Choose one to start.'); s = null; }
  if (s) form.querySelector('input[name="service"][value="' + s + '"]').checked = true;
  var a = q.get('area');
  if (a) { if (has(D.satAreas, a)) area.value = a; else notes.push('“' + a + '” isn’t a SAT area we list — choose one below.'); }
  var p = q.get('apSubject');
  if (p) { if (has(D.apSubjects, p)) ap.value = p; else notes.push('“' + p + '” isn’t in our AP subject list — choose one below, or “Not listed” and describe the course.'); }

  var sel = $('selection');
  function row(k, v, href) { return '<div class="item"><span class="k">' + k + '</span><span class="v">' + v + (href ? ' <a href="' + href + '">Change</a>' : '') + '</span></div>'; }
  function expertLabelFor(s) { return s === 'admissions' ? 'Preferred expert' : 'Interested tutor'; }
  function backFor(s, d) {
    return s === 'admissions' ? '../admissions/#experts'
      : s === 'sat' ? '../tutoring/sat/' + (d ? '?area=' + d : '')
      : s === 'ap' ? '../tutoring/ap/' + (d ? '?apSubject=' + d : '')
      : '../#support';
  }
  function renderSel() {
    var s = service(), d = detail();
    var who = ex.value ? (s === 'admissions' ? label(D.officers, ex.value) : label(D.tutors, ex.value) + ' (' + label(D.tutors.map(function (t) { return { id: t.id, label: t.meta }; }), ex.value) + ')') : (s === 'admissions' ? 'Not sure yet' : 'None yet');
    sel.innerHTML = row('Service', s ? NAMES[s] : 'Not chosen yet', backFor(s, d)) +
      (s === 'sat' ? row('Area', d ? label(D.satAreas, d) : 'Not chosen yet') : '') +
      (s === 'ap' ? row('AP subject', d ? label(D.apSubjects, d) : 'Not chosen yet') : '') +
      (s ? row(expertLabelFor(s), who) : '');
    var back = $('doneBack'); if (back) back.setAttribute('href', s === 'admissions' ? '../admissions/' : s === 'sat' ? '../tutoring/sat/' : s === 'ap' ? '../tutoring/ap/' : '../');
  }

  // Spec p.12: when the service / area / subject change, values that no longer fit are cleared — including the chosen expert.
  function sync() {
    var s = service(), d = detail();
    $('areaField').hidden = s !== 'sat'; $('apField').hidden = s !== 'ap'; $('expertField').hidden = !s;
    if (s !== 'sat') area.value = ''; if (s !== 'ap') ap.value = '';
    var list, placeholder;
    if (s === 'admissions') {
      list = D.officers.map(function (o) { return { id: o.id, label: o.name + ' — ' + o.meta }; }); placeholder = 'Not sure yet — suggest one';
    } else if (s) {
      var open = !d || d === 'both' || d === 'unsure' || d === 'other';
      list = D.tutors.filter(function (t) { return t.subject === s && (open || t.match.indexOf(d) > -1); })
        .map(function (t) { return { id: t.id, label: t.name + ' — ' + t.meta }; });
      placeholder = 'None — let our team suggest';
    } else { list = []; placeholder = 'Choose a service first'; }
    var cur = ex.value; fill(ex, list, placeholder); ex.disabled = !s;
    if (cur && list.some(function (i) { return i.id === cur; })) ex.value = cur;
    $('expertLabel').textContent = expertLabelFor(s);
    $('expertHelp').textContent = s === 'admissions'
      ? 'Naming an officer records your preference. Availability is confirmed afterwards — if they can’t take a session soon, we’ll say so and suggest an alternative.'
      : 'Naming a tutor records your interest. It isn’t an assignment — our team confirms availability and fit, and you choose from the shortlist.';
    $('messageHelp').textContent = s === 'admissions'
      ? 'Where you stand, what you’re weighing, or one specific decision. Rough is fine.'
      : s ? 'Current level (a score, a practice test, or none yet), your goal or test date, and how you like to learn. Rough is fine.'
      : 'Rough is fine — a few sentences is plenty.';
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
    else notes.push('The profile “' + e + '” isn’t available for this selection, so the expert field was left empty. Naming someone is optional.');
  }
  if (notes.length && notice) { notice.querySelector('[data-text]').innerHTML = notes.map(function (n) { return '<p>' + n + '</p>'; }).join(''); notice.hidden = false; }

  // ---- S01-01 input errors: message next to the field, values kept ----
  var attempted = false;
  function validate(focusFirst) {
    var ok = true, first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[data-required]'), function (f) {
      if (f.hidden) { f.classList.remove('invalid'); return; }
      var input = f.querySelector('input, select, textarea'), bad, msg = f.getAttribute('data-msg') || 'This field is required.';
      if (input.type === 'checkbox') bad = !input.checked;
      else if (input.type === 'radio') bad = !form.querySelector('input[name="' + input.name + '"]:checked');
      else bad = !input.value.trim();
      if (!bad && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { bad = true; msg = 'Enter an email address like name@example.com — it’s how we reply.'; }
      f.classList.toggle('invalid', bad);
      var err = f.querySelector('.err'); if (err) err.textContent = bad ? msg : '';
      if (input.type !== 'radio') input.setAttribute('aria-invalid', String(bad));
      if (bad) { ok = false; if (!first) first = input; }
    });
    var count = $('errCount');
    if (count) { var n = form.querySelectorAll('.invalid').length; count.hidden = ok; count.textContent = n ? (n === 1 ? '1 field needs attention.' : n + ' fields need attention.') : ''; }
    if (!ok && focusFirst && first) first.focus();
    return ok;
  }
  form.addEventListener('input', function () { if (attempted) validate(false); });
  form.addEventListener('change', function () { if (attempted) validate(false); });

  // ---- S01-02 sending · S01-03 received · S01-04 failed ----
  var btn = $('submitBtn'), fail = $('failBanner'), done = $('done');
  function setSending(on) { btn.disabled = on; btn.setAttribute('aria-busy', String(on)); btn.textContent = on ? 'Sending…' : btn.getAttribute('data-label'); }
  function build() {
    var f = new FormData(form), o = { sentAt: new Date().toISOString() };
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
    fail.querySelector('[data-text]').textContent = notConnected
      ? 'This form isn’t connected to our inbox yet, so nothing was sent. Your answers are still here — please email us at ' + D.contact + ' in the meantime.'
      : 'We couldn’t send your request. Nothing was lost — your answers are still here. Please try again, or email us at ' + D.contact + '.';
    fail.hidden = false; fail.focus();
  }
  function showDone(payload) {
    done.querySelector('[data-email]').textContent = payload.email;
    var facts = done.querySelector('[data-facts]'); facts.innerHTML = '';
    var s = payload.service, items = [['Service', NAMES[s]]];
    if (s === 'sat') items.push(['Area', label(D.satAreas, payload.area)]);
    if (s === 'ap') items.push(['AP subject', label(D.apSubjects, payload.apSubject)]);
    items.push([expertLabelFor(s), payload.expertId ? (s === 'admissions' ? label(D.officers, payload.expertId) : label(D.tutors, payload.expertId)) : (s === 'admissions' ? 'Not sure yet — we’ll suggest' : 'None — our team will suggest')]);
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
