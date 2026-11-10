// Campaign details stay in the current tab for enquiries and opted-in click measurement.
(function () {
  'use strict';
  var query = new URLSearchParams(location.search);
  if (query.has('demo') || /^\/admin(?:\/|$)/i.test(location.pathname)) return;

  var campaignKey = 'pm-campaign';
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var campaign = {};
  utmKeys.concat(['fbclid', 'gclid']).forEach(function (key) {
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
  var entryKey = 'pm-advertising-entry';
  var choice;
  var entry;
  var started = false;
  var production = location.origin === 'https://prepmodule.com';
  var optedOut = navigator.globalPrivacyControl === true;
  var ko = document.documentElement.lang === 'ko';
  var referrer;
  try { choice = localStorage.getItem(choiceKey); } catch (_) {}
  try { referrer = new URL(document.referrer); } catch (_) {}

  function publicPath(path) {
    if (typeof path !== 'string' || path.length > 100 || /^\/admin(?:\/|$)/i.test(path)) return '';
    path = path.replace(/\/index\.html$/, '/');
    return /^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(path) ? path : '';
  }

  function rememberEntry() {
    var current = { page: publicPath(location.pathname) };
    if (referrer && /^https?:$/.test(referrer.protocol) && referrer.origin !== location.origin) {
      current.referrer = referrer.hostname;
    }
    entry = current;
    try {
      var saved = JSON.parse(sessionStorage.getItem(entryKey));
      if (saved && publicPath(saved.page)) entry = saved;
      else sessionStorage.setItem(entryKey, JSON.stringify(current));
    } catch (_) {}
  }

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
      rememberEntry();
    } catch (_) { started = false; }
  }

  function lead(service) {
    if (!started || optedOut || choice !== 'allow' || (service !== 'admissions' && service !== 'tutoring')) return;
    try { window.fbq('trackSingle', pixelId, 'Lead', { content_category: service }); } catch (_) {}
  }
  function kakaoClick() {
    if (!started || optedOut || choice !== 'allow') return;
    var params = { site_language: ko ? 'ko' : 'en', button_location: 'floating_chat' };
    var clickPage = publicPath(location.pathname);
    var entryPage = entry && publicPath(entry.page);
    var previousPage = referrer && referrer.origin === location.origin && publicPath(referrer.pathname);
    if (clickPage) params.click_page = clickPage;
    if (entryPage) params.entry_page = entryPage;
    if (previousPage) params.previous_page = previousPage;
    if (entry && typeof entry.referrer === 'string' && /^[a-z0-9.-]{1,100}$/.test(entry.referrer)) {
      params.entry_referrer = entry.referrer;
    }
    var tags = attribution();
    utmKeys.forEach(function (key) {
      var value = tags[key];
      if (typeof value === 'string' && /^[\p{L}\p{N}_. -]{1,100}$/u.test(value)) params[key] = value;
    });
    params.traffic_source = params.utm_source || params.entry_referrer || 'direct_or_unknown';
    try { window.fbq('trackSingleCustom', pixelId, 'KakaoClick', params); } catch (_) {}
  }
  window.PMMarketing = { attribution: attribution, lead: lead, kakaoClick: kakaoClick };
  if (optedOut) return;

  var copy = ko ? {
    title: '광고 측정 설정', details: '동의하시면 Meta Pixel로 페이지 방문, 상담 신청 완료, 카카오톡 채널 버튼 클릭을 측정합니다.',
    privacy: '개인정보처리방침', allow: '허용', deny: '거부'
  } : {
    title: 'Advertising preferences', details: 'With your permission, we use Meta Pixel to measure page visits, completed enquiries and clicks to our KakaoTalk channel.',
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
      if (choice === 'allow' && !entry) rememberEntry();
    } else startPixel();
    if (choice !== 'allow') {
      entry = undefined;
      try { sessionStorage.removeItem(entryKey); } catch (_) {}
    }
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
