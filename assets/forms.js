// PrepModule — request forms (F01 admissions, F02 tutoring) and the four S01 states:
// input error · sending · received · failed. Success is shown only after the request was actually accepted.
(function () {
  var form = document.getElementById('form'); if (!form || !window.PM) return;
  var D = window.PM, kind = form.getAttribute('data-form'), q = new URLSearchParams(location.search);
  var $ = function (id) { return document.getElementById(id); };
  var notice = $('paramNotice'), notes = [];
  var demo = q.get('demo');

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
  function label(items, id) { var f = items.filter(function (i) { return i.id === id; })[0]; return f ? f.label || f.name : ''; }

  // ---- shared fields ----
  fill($('grade'), D.grades, 'Select grade');
  var tz = $('timezone'), zones = D.timeZones;
  try { if (Intl.supportedValuesOf) zones = Intl.supportedValuesOf('timeZone'); } catch (e) {}
  var mine = ''; try { mine = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  fill(tz, zones.map(function (z) { return { id: z, label: z.replace(/_/g, ' ') }; }), 'Choose your time zone');
  if (zones.indexOf(mine) > -1) tz.value = mine;

  // ---- product-specific fields, prefilled from the landing's URL (ids only) ----
  var sel = $('selection');
  function row(k, v, href) {
    return '<div class="item"><span class="k">' + k + '</span><span class="v">' + v + (href ? ' <a href="' + href + '">Change</a>' : '') + '</span></div>';
  }
  var renderSel;

  if (kind === 'admissions') {
    var ex = $('expertId');
    fill(ex, D.officers.map(function (o) { return { id: o.id, label: o.name + ' — ' + o.meta }; }), 'Not sure yet — suggest one');
    var want = q.get('expertId');
    if (want) {
      if (has(D.officers, want)) ex.value = want;
      else notes.push('The officer profile “' + want + '” isn’t available, so “Preferred expert” was left as “Not sure yet”. You can still pick one below.');
    }
    renderSel = function () {
      sel.innerHTML = row('Service', 'Admissions conversation') +
        row('Preferred expert', ex.value ? label(D.officers, ex.value) : 'Not sure yet', '../../admissions/#experts');
    };
    ex.addEventListener('change', renderSel);
  } else {
    var radios = form.querySelectorAll('input[name="subject"]'), area = $('area'), ap = $('apSubject'), tut = $('expertId');
    fill(area, D.satAreas, 'Choose an area');
    fill(ap, D.apSubjects, 'Choose your AP subject');
    var s = q.get('subject');
    if (s && s !== 'sat' && s !== 'ap') { notes.push('“' + s + '” isn’t a subject we offer. Choose SAT or AP to start.'); s = null; }
    if (s) form.querySelector('input[name="subject"][value="' + s + '"]').checked = true;
    var a = q.get('area');
    if (a) { if (has(D.satAreas, a)) area.value = a; else notes.push('“' + a + '” isn’t a SAT area we list — choose one below.'); }
    var p = q.get('apSubject');
    if (p) { if (has(D.apSubjects, p)) ap.value = p; else notes.push('“' + p + '” isn’t in our AP subject list — choose one below, or “Not listed” and describe the course.'); }

    function subject() { var r = form.querySelector('input[name="subject"]:checked'); return r ? r.value : ''; }
    function detail() { return subject() === 'sat' ? area.value : subject() === 'ap' ? ap.value : ''; }
    // Spec p.12: when subject / area / apSubject change, values that no longer fit are cleared — including the interested tutor.
    function sync() {
      var v = subject(), d = detail();
      $('areaField').hidden = v !== 'sat'; $('apField').hidden = v !== 'ap';
      if (v !== 'sat') area.value = ''; if (v !== 'ap') ap.value = '';
      var open = !d || d === 'both' || d === 'unsure' || d === 'other';
      var list = D.tutors.filter(function (t) { return t.subject === v && (open || t.match.indexOf(d) > -1); });
      var cur = tut.value;
      fill(tut, list.map(function (t) { return { id: t.id, label: t.name + ' — ' + t.meta }; }), v ? 'None — let our team suggest' : 'Choose a subject first');
      tut.disabled = !v;
      if (cur && list.some(function (t) { return t.id === cur; })) tut.value = cur;
      renderSel();
    }
    renderSel = function () {
      var v = subject(), d = detail();
      var back = v === 'sat' ? '../../tutoring/sat/' + (d ? '?area=' + d : '') : v === 'ap' ? '../../tutoring/ap/' + (d ? '?apSubject=' + d : '') : '../../#support';
      sel.innerHTML = row('Service', v ? (v === 'sat' ? 'SAT tutoring' : 'AP tutoring') : 'Not chosen yet', back) +
        (v === 'sat' ? row('Area', d ? label(D.satAreas, d) : 'Not chosen yet') : '') +
        (v === 'ap' ? row('AP subject', d ? label(D.apSubjects, d) : 'Not chosen yet') : '') +
        row('Interested tutor', tut.value ? label(D.tutors, tut.value) + ' (' + label(D.tutors.map(function (t) { return { id: t.id, label: t.meta }; }), tut.value) + ')' : 'None yet');
    };
    Array.prototype.forEach.call(radios, function (r) { r.addEventListener('change', sync); });
    area.addEventListener('change', sync); ap.addEventListener('change', sync); tut.addEventListener('change', renderSel);
    sync();
    var e = q.get('expertId');
    if (e) {
      if (Array.prototype.some.call(tut.options, function (o) { return o.value === e; })) { tut.value = e; renderSel(); }
      else notes.push('The tutor profile “' + e + '” isn’t available for this selection, so “Interested tutor” was left empty. Naming a tutor is optional.');
    }
  }
  renderSel();
  if (notes.length && notice) { notice.querySelector('[data-text]').innerHTML = notes.map(function (n) { return '<p>' + n + '</p>'; }).join(''); notice.hidden = false; }

  // ---- S01-01 input errors: message next to the field, values kept ----
  var attempted = false;
  function validate(focusFirst) {
    var ok = true, first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[data-required]'), function (f) {
      if (f.hidden) { f.classList.remove('invalid'); return; }
      var input = f.querySelector('input, select, textarea'), bad, msg = f.getAttribute('data-msg') || 'This field is required.';
      if (input.type === 'checkbox') bad = !input.checked;
      else if (input.type === 'radio') { bad = !form.querySelector('input[name="' + input.name + '"]:checked'); }
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
  function setSending(on) {
    btn.disabled = on; btn.setAttribute('aria-busy', String(on));
    btn.textContent = on ? 'Sending…' : btn.getAttribute('data-label');
  }
  function build() {
    var f = new FormData(form), o = { form: kind, sentAt: new Date().toISOString() };
    f.forEach(function (v, k) { if (k !== 'website') o[k] = typeof v === 'string' ? v.trim() : v; });
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
    var facts = done.querySelector('[data-facts]');
    facts.innerHTML = '';
    var items = kind === 'admissions'
      ? [['Service', 'Admissions conversation'], ['Preferred expert', payload.expertId ? label(D.officers, payload.expertId) : 'Not sure yet — we’ll suggest']]
      : [['Service', payload.subject === 'sat' ? 'SAT tutoring' : 'AP tutoring'],
         [payload.subject === 'sat' ? 'Area' : 'AP subject', payload.subject === 'sat' ? label(D.satAreas, payload.area) : label(D.apSubjects, payload.apSubject)],
         ['Interested tutor', payload.expertId ? label(D.tutors, payload.expertId) : 'None — our team will suggest']];
    items.forEach(function (i) { var li = document.createElement('li'); li.innerHTML = '<span class="k">' + i[0] + '</span><span>' + i[1] + '</span>'; facts.appendChild(li); });
    form.hidden = true; if (notice) notice.hidden = true;
    var aside = document.querySelector('.rail'); if (aside) aside.hidden = true;
    done.hidden = false; done.focus(); done.scrollIntoView({ block: 'start' });
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); attempted = true;
    fail.hidden = true;
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
      if (kind === 'tutoring' && !form.querySelector('input[name="subject"]:checked')) { form.querySelector('input[name="subject"][value="sat"]').checked = true; form.querySelector('input[name="subject"]').dispatchEvent(new Event('change', { bubbles: true })); }
      if (kind === 'tutoring' && !$('areaField').hidden && !$('area').value) { $('area').value = 'rw'; $('area').dispatchEvent(new Event('change', { bubbles: true })); }
      demoFill('name', 'Demo Student'); demoFill('email', 'demo@example.com'); demoFill('grade', 'g11');
      demoFill('message', 'Demo request — this text is sample content and nothing is sent.');
      form.consent.checked = true;
      form.requestSubmit ? form.requestSubmit() : btn.click();
    }
  }
})();
