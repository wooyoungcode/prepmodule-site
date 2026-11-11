// Campaign details stay in the current tab for enquiries and advertising measurement.
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

  // Advertising defaults to enabled unless a saved decline or GPC overrides it.
  var pixelId = '1764701667969984';
  var choiceKey = 'pm-advertising';
  var entryKey = 'pm-advertising-entry';
  var choice = advertisingChoice();
  var entry;
  var started = false;
  var production = location.origin === 'https://prepmodule.com';
  var optedOut = navigator.globalPrivacyControl === true;
  var ko = document.documentElement.lang === 'ko';
  var referrer;
  try { referrer = new URL(document.referrer); } catch (_) {}

  function advertisingChoice() {
    try {
      if (localStorage.getItem(choiceKey) === 'deny') return 'deny';
    } catch (_) {}
    return 'allow';
  }

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

  var preferences = document.querySelector('[data-ad-preferences]');
  var preferenceButtons = preferences ? preferences.querySelectorAll('button[data-choice]') : [];
  function updatePreferenceButtons() {
    preferenceButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(choice === button.dataset.choice));
    });
  }
  function applyChoice(next) {
    choice = next;
    if (started) {
      try { window.fbq('consent', choice === 'allow' ? 'grant' : 'revoke'); } catch (_) {}
      if (choice === 'allow' && !entry) rememberEntry();
    } else startPixel();
    if (choice !== 'allow') {
      entry = undefined;
      try { sessionStorage.removeItem(entryKey); } catch (_) {}
    }
    updatePreferenceButtons();
  }
  preferenceButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      try { localStorage.setItem(choiceKey, button.dataset.choice); } catch (_) {}
      applyChoice(button.dataset.choice);
    });
  });
  window.addEventListener('storage', function (event) {
    if (event.key === choiceKey || event.key === null) {
      applyChoice(advertisingChoice());
    }
  });
  if (preferences) {
    updatePreferenceButtons();
    preferences.hidden = false;
  }
  startPixel();
})();
