(function () {
  if (window.__alertInit) return;
  window.__alertInit = true;

  const QUERY_DISMISS_MS = 5000;
  const EXIT_DURATION_MS = 220;

  const ALERT_SELECTOR = '[data-alert]';
  const CONTAINER_SELECTOR = '[data-alert-container]';
  const HIDDEN_MESSAGES = new Set(['Session_expired']);

  function isHiddenMessage(message) {
    if (!message) return false;
    return HIDDEN_MESSAGES.has(String(message).trim());
  }

  function getContainer() {
    let container = document.querySelector(CONTAINER_SELECTOR);
    if (container) return container;

    const main = document.querySelector('main');
    container = document.createElement('div');
    container.setAttribute('data-alert-container', '');
    if (main) {
      main.prepend(container);
    } else {
      document.body.prepend(container);
    }
    return container;
  }

  function createAlertElement(type, message, source) {
    if (isHiddenMessage(message)) return null;
    const wrapper = document.createElement('div');
    wrapper.className =
      type === 'error'
        ? 'mb-6 rounded-xl border-l-4 border-rose-500 bg-linear-to-r from-rose-50 to-rose-50/50 p-4 shadow-sm animate-slideIn'
        : 'mb-6 rounded-xl border-l-4 border-green-500 bg-linear-to-r from-green-50 to-green-50/50 p-4 shadow-sm animate-slideIn';
    wrapper.setAttribute('role', 'alert');
    wrapper.setAttribute('data-alert', '');
    wrapper.setAttribute('data-alert-type', type);
    if (source) wrapper.setAttribute('data-alert-source', source);

    const icon = type === 'error'
      ? '<svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
      : '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';

    const textClass = type === 'error' ? 'text-rose-700' : 'text-green-700';
    wrapper.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="shrink-0">${icon}</div>
        <div class="flex-1">
          <p class="text-sm ${textClass} mt-1" data-alert-message></p>
        </div>
        <button type="button" class="ml-2 ${type === 'error' ? 'text-rose-500/70 hover:text-rose-600' : 'text-green-500/70 hover:text-green-600'} transition" data-alert-close aria-label="Dismiss alert">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
    wrapper.querySelector('[data-alert-message]').textContent = message;

    return wrapper;
  }

  function dismissAlert(el) {
    if (!el || el.dataset.alertClosing === 'true') return;
    el.dataset.alertClosing = 'true';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    window.setTimeout(() => {
      el.remove();
    }, EXIT_DURATION_MS);
  }

  function mountAlert(el) {
    if (!el) return;
    el.style.transition = 'opacity 180ms ease, transform 180ms ease';

    const dismissMs = Number(el.getAttribute('data-alert-dismiss'));
    if (Number.isFinite(dismissMs) && dismissMs > 0) {
      window.setTimeout(() => dismissAlert(el), dismissMs);
    }
  }

  function parseQueryAlerts() {
    const params = new URLSearchParams(window.location.search);
    const result = { success: null, error: null };

    const directSuccess = params.get('success');
    const directError = params.get('error');
    if (directSuccess) result.success = directSuccess;
    if (directError) result.error = directError;

    const jsonAlert = params.get('alert');
    if (jsonAlert) {
      try {
        const parsed = JSON.parse(jsonAlert);
        if (parsed && typeof parsed === 'object') {
          if (!result.success && typeof parsed.success === 'string') {
            result.success = parsed.success;
          }
          if (!result.error && typeof parsed.error === 'string') {
            result.error = parsed.error;
          }
        }
      } catch (_) {
        // ignore invalid JSON
      }
    }

    if (directSuccess || directError || jsonAlert) {
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('error');
      url.searchParams.delete('alert');
      window.history.replaceState({}, '', url);
    }

    if (isHiddenMessage(result.success)) result.success = null;
    if (isHiddenMessage(result.error)) result.error = null;

    return result;
  }

  function getExistingMessages() {
    const messages = new Set();
    document.querySelectorAll(ALERT_SELECTOR).forEach((el) => {
      const messageEl = el.querySelector('[data-alert-message]');
      const text = messageEl ? messageEl.textContent : el.textContent;
      if (text) messages.add(text.trim());
    });
    return messages;
  }

  document.querySelectorAll(ALERT_SELECTOR).forEach((el) => {
    const messageEl = el.querySelector('[data-alert-message]');
    const text = messageEl ? messageEl.textContent : el.textContent;
    if (isHiddenMessage(text)) {
      el.remove();
      return;
    }
    mountAlert(el);
  });
  document.addEventListener('click', (event) => {
    const closeBtn = event.target.closest('[data-alert-close]');
    if (!closeBtn) return;
    const alertEl = closeBtn.closest(ALERT_SELECTOR);
    dismissAlert(alertEl);
  });

  const { success, error } = parseQueryAlerts();
  const container = getContainer();
  const existingMessages = getExistingMessages();

  if (error && !existingMessages.has(error.trim())) {
    const alertEl = createAlertElement('error', error, 'query');
    if (!alertEl) return;
    alertEl.setAttribute('data-alert-dismiss', String(QUERY_DISMISS_MS));
    container.prepend(alertEl);
    mountAlert(alertEl);
  }

  if (success && !existingMessages.has(success.trim())) {
    const alertEl = createAlertElement('success', success, 'query');
    if (!alertEl) return;
    alertEl.setAttribute('data-alert-dismiss', String(QUERY_DISMISS_MS));
    container.prepend(alertEl);
    mountAlert(alertEl);
  }
})();
