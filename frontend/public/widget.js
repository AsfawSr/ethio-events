/**
 * EthioEvents Embeddable Ticket Widget SDK v1.0.0
 * (c) EthioEvents Addis Ababa. All Rights Reserved.
 *
 * Usage 1 - Inline Embed:
 * <div id="ethioevents-ticket-widget" data-event-slug="rophnan-sost-live-millennium-hall" data-theme="dark" data-lang="en"></div>
 * <script src="https://ethioevents.et/widget.js" async></script>
 *
 * Usage 2 - Trigger Button Modal:
 * <button class="ethioevents-buy-btn" data-event-slug="rophnan-sost-live-millennium-hall" data-theme="dark">🎟️ Buy Tickets</button>
 */

(function () {
  'use strict';

  if (window.EthioEventsWidgetInitialized) return;
  window.EthioEventsWidgetInitialized = true;

  // Determine base URL from script src or current origin
  function getBaseUrl() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('/widget.js') !== -1) {
        var a = document.createElement('a');
        a.href = src;
        return a.protocol + '//' + a.host;
      }
    }
    return window.location.origin;
  }

  var BASE_URL = getBaseUrl();

  // Inject CSS styles for modal & floating elements
  function injectStyles() {
    if (document.getElementById('ethioevents-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'ethioevents-widget-styles';
    style.innerHTML = '\
      .ee-modal-backdrop {\
        position: fixed;\
        top: 0;\
        left: 0;\
        width: 100vw;\
        height: 100vh;\
        background: rgba(0, 0, 0, 0.85);\
        backdrop-filter: blur(8px);\
        -webkit-backdrop-filter: blur(8px);\
        z-index: 999999;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        padding: 16px;\
        box-sizing: border-box;\
        opacity: 0;\
        visibility: hidden;\
        transition: opacity 0.25s ease, visibility 0.25s ease;\
      }\
      .ee-modal-backdrop.ee-open {\
        opacity: 1;\
        visibility: visible;\
      }\
      .ee-modal-dialog {\
        position: relative;\
        width: 100%;\
        max-width: 580px;\
        max-height: 92vh;\
        background: #0B0F19;\
        border: 1px solid rgba(255, 255, 255, 0.12);\
        border-radius: 20px;\
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15);\
        overflow: hidden;\
        transform: scale(0.95) translateY(10px);\
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);\
        display: flex;\
        flex-direction: column;\
      }\
      .ee-modal-backdrop.ee-open .ee-modal-dialog {\
        transform: scale(1) translateY(0);\
      }\
      .ee-modal-close-btn {\
        position: absolute;\
        top: 14px;\
        right: 14px;\
        width: 32px;\
        height: 32px;\
        background: rgba(255, 255, 255, 0.1);\
        border: 1px solid rgba(255, 255, 255, 0.15);\
        border-radius: 50%;\
        color: #ffffff;\
        font-size: 18px;\
        line-height: 1;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        z-index: 10;\
        transition: background 0.2s ease, transform 0.15s ease;\
      }\
      .ee-modal-close-btn:hover {\
        background: rgba(239, 68, 68, 0.8);\
        transform: scale(1.05);\
      }\
      .ee-iframe {\
        width: 100%;\
        border: none;\
        display: block;\
        transition: height 0.2s ease;\
      }\
      .ee-floating-badge {\
        position: fixed;\
        bottom: 24px;\
        right: 24px;\
        z-index: 99999;\
        background: linear-gradient(135deg, #F59E0B, #D97706);\
        color: #000000;\
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
        font-size: 14px;\
        font-weight: 800;\
        padding: 12px 20px;\
        border-radius: 9999px;\
        border: none;\
        box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5), 0 0 15px rgba(245, 158, 11, 0.3);\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        gap: 8px;\
        transition: transform 0.2s ease, box-shadow 0.2s ease;\
      }\
      .ee-floating-badge:hover {\
        transform: translateY(-2px) scale(1.03);\
        box-shadow: 0 15px 30px -5px rgba(245, 158, 11, 0.6);\
      }\
    ';
    document.head.appendChild(style);
  }

  // Active modal state
  var activeModal = null;
  var iframesRegistry = {};

  function createEmbedUrl(slug, options) {
    options = options || {};
    var theme = options.theme || 'dark';
    var color = options.color ? encodeURIComponent(options.color) : '';
    var lang = options.lang || 'en';
    var ref = options.ref || '';
    var isModal = options.isModal ? '1' : '0';

    var query = [];
    if (theme) query.push('theme=' + theme);
    if (color) query.push('color=' + color);
    if (lang) query.push('lang=' + lang);
    if (ref) query.push('ref=' + encodeURIComponent(ref));
    if (isModal) query.push('modal=' + isModal);

    return BASE_URL + '/embed/' + encodeURIComponent(slug) + (query.length > 0 ? '?' + query.join('&') : '');
  }

  // Open modal popup for an event
  function openModal(slug, options) {
    injectStyles();
    options = options || {};

    if (activeModal) {
      closeModal();
    }

    var backdrop = document.createElement('div');
    backdrop.className = 'ee-modal-backdrop';

    var dialog = document.createElement('div');
    dialog.className = 'ee-modal-dialog';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ee-modal-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close Ticket Checkout';
    closeBtn.onclick = closeModal;

    var iframe = document.createElement('iframe');
    iframe.className = 'ee-iframe';
    iframe.style.height = '600px';
    iframe.src = createEmbedUrl(slug, Object.assign({}, options, { isModal: true }));
    iframe.setAttribute('allow', 'payment');

    var iframeId = 'ee-iframe-modal-' + Math.random().toString(36).substr(2, 9);
    iframe.id = iframeId;
    iframesRegistry[iframeId] = iframe;

    dialog.appendChild(closeBtn);
    dialog.appendChild(iframe);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    backdrop.onclick = function (e) {
      if (e.target === backdrop) closeModal();
    };

    // Trigger animate in
    setTimeout(function () {
      backdrop.classList.add('ee-open');
    }, 10);

    activeModal = { backdrop: backdrop, iframeId: iframeId };

    document.addEventListener('keydown', handleEscKey);
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.backdrop.classList.remove('ee-open');
    setTimeout(function () {
      if (activeModal && activeModal.backdrop.parentNode) {
        activeModal.backdrop.parentNode.removeChild(activeModal.backdrop);
      }
      if (activeModal) {
        delete iframesRegistry[activeModal.iframeId];
      }
      activeModal = null;
    }, 260);
    document.removeEventListener('keydown', handleEscKey);
  }

  function handleEscKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeModal();
    }
  }

  // Initialize inline widget containers
  function initInlineWidgets() {
    var containers = document.querySelectorAll('#ethioevents-ticket-widget, .ethioevents-ticket-widget, [data-ethioevents-embed]');
    for (var i = 0; i < containers.length; i++) {
      var el = containers[i];
      if (el.getAttribute('data-ee-initialized')) continue;
      el.setAttribute('data-ee-initialized', 'true');

      var slug = el.getAttribute('data-event-slug') || el.getAttribute('data-event') || 'default';
      var theme = el.getAttribute('data-theme') || 'dark';
      var color = el.getAttribute('data-color') || '';
      var lang = el.getAttribute('data-lang') || 'en';
      var ref = el.getAttribute('data-ref') || '';

      var iframe = document.createElement('iframe');
      iframe.className = 'ee-iframe';
      iframe.style.width = '100%';
      iframe.style.height = '540px';
      iframe.style.borderRadius = '16px';
      iframe.style.overflow = 'hidden';
      iframe.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
      iframe.src = createEmbedUrl(slug, { theme: theme, color: color, lang: lang, ref: ref });
      iframe.setAttribute('allow', 'payment');

      var iframeId = 'ee-iframe-' + Math.random().toString(36).substr(2, 9);
      iframe.id = iframeId;
      iframesRegistry[iframeId] = iframe;

      el.innerHTML = '';
      el.appendChild(iframe);
    }
  }

  // Initialize button triggers
  function initButtons() {
    var buttons = document.querySelectorAll('.ethioevents-buy-btn, [data-ethioevents-event]');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        if (btn.getAttribute('data-ee-btn-initialized')) return;
        btn.setAttribute('data-ee-btn-initialized', 'true');

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var slug = btn.getAttribute('data-event-slug') || btn.getAttribute('data-ethioevents-event');
          var theme = btn.getAttribute('data-theme') || 'dark';
          var color = btn.getAttribute('data-color') || '';
          var lang = btn.getAttribute('data-lang') || 'en';
          var ref = btn.getAttribute('data-ref') || '';
          if (slug) {
            openModal(slug, { theme: theme, color: color, lang: lang, ref: ref });
          }
        });
      })(buttons[i]);
    }
  }

  // Cross-origin message listener
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;

    var type = e.data.type;
    var payload = e.data.payload || {};

    if (type === 'ETHIOEVENTS_RESIZE') {
      var height = e.data.height;
      if (height) {
        // Adjust iframes matching source
        for (var id in iframesRegistry) {
          var iframe = iframesRegistry[id];
          if (iframe && iframe.contentWindow === e.source) {
            iframe.style.height = Math.max(380, height + 10) + 'px';
          }
        }
      }
    } else if (type === 'ETHIOEVENTS_MODAL_CLOSE') {
      closeModal();
    } else if (type === 'ETHIOEVENTS_ORDER_COMPLETED') {
      // Dispatch custom event to host window
      var customEv = new CustomEvent('ethioevents:order_completed', {
        detail: payload,
        bubbles: true,
      });
      window.dispatchEvent(customEv);
      document.dispatchEvent(customEv);
    }
  });

  // Main init function
  function init() {
    injectStyles();
    initInlineWidgets();
    initButtons();
  }

  // Expose global SDK
  window.EthioEventsWidget = {
    init: init,
    openModal: openModal,
    closeModal: closeModal,
    version: '1.0.0',
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
