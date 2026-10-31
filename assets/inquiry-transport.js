// Fixed-recipient enquiry delivery. Never forwards arbitrary provider options or URL parameters.
(function (root) {
  'use strict';
  var ENDPOINT = 'https://formsubmit.co/ajax/info@prepmodule.com';
  var SUBJECT = '[PrepModule] 신규 상담 신청 / New enquiry';
  function error(code) { var e = new Error(code); e.code = code; return e; }
  function text(value, max, required) {
    if (typeof value !== 'string') { if (required) throw error('invalid-request'); return ''; }
    value = value.trim();
    if ((required && !value) || value.length > max) throw error('invalid-request');
    return value;
  }
  function choice(items, id) {
    var item = (items || []).filter(function (entry) { return entry.id === id; })[0];
    return item ? item.name || item.label || item.id : id;
  }
  function fields(payload, catalog) {
    if (!payload || payload.consent !== true) throw error('invalid-request');
    catalog = catalog || {};
    var name = text(payload.name, 100, true);
    var email = text(payload.email, 254, true);
    if (/[\r\n]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error('invalid-request');
    if (payload.service !== 'tutoring' && payload.service !== 'admissions') throw error('invalid-request');
    var language = payload.lang === 'ko' ? 'ko' : 'en';
    var result = {
      _subject: SUBJECT,
      _template: 'table',
      _url: 'https://prepmodule.com/' + (language === 'ko' ? 'ko/' : '') + 'request/',
      _replyto: email,
      _honey: '',
      email: email,
      '연락 이름 / Contact name': name,
      '서비스 / Service': payload.service === 'tutoring' ? '교과 튜터링 / Subject tutoring' : '입학 상담 / Admissions conversation',
      '학생 학년 / Student grade': choice(catalog.grades, text(payload.grade, 60, true)),
      '시간대 / Time zone': text(payload.timezone, 100, true),
      '문의 내용 / Message': text(payload.message, 5000, true),
      '개인정보 동의 / Privacy consent': '동의함 / Agreed',
      '신청 언어 / Language': language.toUpperCase(),
      '접수 시각 / Submitted at': text(payload.sentAt, 50, true)
    };
    if (payload.service === 'tutoring') {
      result['과정 / Program'] = choice(catalog.programs, text(payload.program, 60, true));
      result['과목 / Subject'] = text(payload.subject, 150, false) || '선택 안 함 / Not specified';
    }
    var expert = text(payload.expertId, 80, false);
    result['희망 전문가 / Preferred expert'] = expert
      ? choice(payload.service === 'tutoring' ? catalog.tutors : catalog.officers, expert)
      : '운영팀 추천 / Please suggest';
    return result;
  }
  async function send(payload, catalog, request) {
    var body = fields(payload, catalog);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var response = await (request || root.fetch)(ENDPOINT, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal,
        referrerPolicy: 'strict-origin-when-cross-origin'
      });
      if (!response.ok) throw error(response.status === 429 ? 'rate-limited' : 'not-accepted');
      var result;
      try { result = await response.json(); } catch (_) { throw error('invalid-response'); }
      if (!result || (result.success !== true && result.success !== 'true')) {
        throw error('not-accepted');
      }
      return { accepted: true };
    } catch (e) {
      if (e && e.name === 'AbortError') throw error('timeout');
      throw e;
    } finally { clearTimeout(timer); }
  }
  var api = { send: send, fields: fields, endpoint: ENDPOINT, subject: SUBJECT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PMInquiryTransport = api;
})(typeof window !== 'undefined' ? window : globalThis);
