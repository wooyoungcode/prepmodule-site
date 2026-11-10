// Campaign details stay in the current tab. Only the enquiry transport uses them.
(function () {
  'use strict';
  var query = new URLSearchParams(location.search);
  if (query.has('demo') || /^\/admin(?:\/|$)/i.test(location.pathname)) return;

  var campaignKey = 'pm-campaign';
  var campaign = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach(function (key) {
    var value = (query.get(key) || '').trim();
    if (value && value.length <= 256 && !/[\u0000-\u001f\u007f]/.test(value)) campaign[key] = value;
  });
  if (Object.keys(campaign).length) {
    try { sessionStorage.setItem(campaignKey, JSON.stringify(campaign)); } catch (_) {}
  }

  function attribution() {
    try { return JSON.parse(sessionStorage.getItem(campaignKey)) || campaign; } catch (_) { return campaign; }
  }

  // No third-party advertising script runs before the visitor opts in.
  var pixelId = '1764701667969984';
  var choiceKey = 'pm-advertising';
  var choice;
  var started = false;
  var production = location.origin === 'https://prepmodule.com';
  var optedOut = navigator.globalPrivacyControl === true;
  try { choice = localStorage.getItem(choiceKey); } catch (_) {}

  function startPixel() {
    if (!production || optedOut || started || choice !== 'allow') return;
    started = true;
    try {
      if (!window.fbq) {
        var queue = function () {
          if (queue.callMethod) queue.callMethod.apply(queue, arguments);
          else queue.queue.push(arguments);
        };
        window.fbq = queue;
        if (!window._fbq) window._fbq = queue;
        queue.push = queue;
        queue.loaded = true;
        queue.version = '2.0';
        queue.queue = [];
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(script);
      }
      // Use explicit events only. Never pass form fields or advanced matching data.
      window.fbq('set', 'autoConfig', false, pixelId);
      window.fbq('init', pixelId);
      window.fbq('trackSingle', pixelId, 'PageView');
    } catch (_) { started = false; }
  }

  function lead(service) {
    if (!started || optedOut || choice !== 'allow' || (service !== 'admissions' && service !== 'tutoring')) return;
    try { window.fbq('trackSingle', pixelId, 'Lead', { content_category: service }); } catch (_) {}
  }
  window.PMMarketing = { attribution: attribution, lead: lead };
  if (optedOut) return;

  var ko = document.documentElement.lang === 'ko';
  var copy = ko ? {
    title: '광고 측정 설정', details: '동의하시면 Meta Pixel로 페이지 방문과 상담 신청 완료를 측정합니다.',
    privacy: '개인정보처리방침', allow: '허용', deny: '거부'
  } : {
    title: 'Advertising preferences', details: 'With your permission, we use Meta Pixel to measure page visits and completed enquiries.',
    privacy: 'Privacy Policy', allow: 'Allow', deny: 'Decline'
  };
  var panel = document.createElement('aside');
  panel.className = 'ad-preferences';
  panel.setAttribute('aria-label', copy.title);
  panel.innerHTML = '<p><strong>' + copy.title + '</strong></p><p>' + copy.details + ' <a href="' +
    (ko ? '/ko/privacy/' : '/privacy/') + '#privacy-9">' + copy.privacy + '</a></p>' +
    '<div class="ad-preferences-actions"><button type="button" data-choice="deny">' + copy.deny +
    '</button><button type="button" data-choice="allow">' + copy.allow + '</button></div>';
  var links = document.querySelector('.footer-links');
  var settings = document.createElement('button');
  var returnFocus = false;
  settings.type = 'button';
  settings.className = 'ad-preferences-link';
  settings.textContent = copy.title;
  settings.addEventListener('click', function () {
    returnFocus = true;
    panel.hidden = false;
    panel.querySelector('button').focus();
  });
  if (links) {
    var item = document.createElement('li');
    item.appendChild(settings);
    links.appendChild(item);
  }
  function applyChoice(next) {
    choice = next;
    panel.hidden = choice === 'allow' || choice === 'deny';
    if (started) {
      try { window.fbq('consent', choice === 'allow' ? 'grant' : 'revoke'); } catch (_) {}
    } else startPixel();
  }
  panel.querySelectorAll('button').forEach(function (button) {
    button.addEventListener('click', function () {
      try { localStorage.setItem(choiceKey, button.dataset.choice); } catch (_) {}
      applyChoice(button.dataset.choice);
      if (returnFocus) settings.focus();
      returnFocus = false;
    });
  });
  window.addEventListener('storage', function (event) {
    if (event.key === choiceKey || event.key === null) {
      try { applyChoice(localStorage.getItem(choiceKey)); } catch (_) {}
    }
  });
  panel.hidden = choice === 'allow' || choice === 'deny';
  document.body.appendChild(panel);
  startPixel();
})();
