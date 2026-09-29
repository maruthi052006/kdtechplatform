/**
 * KDTechX Assessment Anti-Cheat Deterrents & Security Telemetry
 * Intercepts clipboard events, tab switches, and fullscreen exits, logging to server.
 */

window.KDTechXSecurity = (function() {
  let settings = {
    attemptId: null,
    telemetryUrl: '',
    requireFullscreen: true,
    preventCopy: true,
    warningLimit: 3,
    violationCount: 0
  };

  function init(options) {
    settings = { ...settings, ...options };

    if (settings.preventCopy) {
      enableClipboardShield();
    }

    enableTabSwitchDetection();

    if (settings.requireFullscreen) {
      enableFullscreenMonitoring();
    }
  }

  function reportSecurityEvent(eventType, metadata = {}) {
    if (!settings.telemetryUrl) return;

    settings.violationCount++;
    const csrfToken = window.getCsrfToken ? window.getCsrfToken() : '';

    fetch(settings.telemetryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({
        event_type: eventType,
        metadata: {
          ...metadata,
          violation_count: settings.violationCount,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(err => {
      console.warn('Security event log dispatch failed:', err);
    });

    // Provide immediate non-intrusive warning
    if (window.KDTechXToast) {
      window.KDTechXToast.show(
        `Security Notice (${settings.violationCount}/${settings.warningLimit}): ${eventType.replace(/_/g, ' ')} recorded.`,
        'warning'
      );
    }
  }

  function enableClipboardShield() {
    const examContainer = document.querySelector('.kd-exam-container') || document.body;

    // Prevent context menu
    examContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      reportSecurityEvent('CONTEXT_MENU');
      return false;
    });

    // Prevent copy
    examContainer.addEventListener('copy', (e) => {
      e.preventDefault();
      reportSecurityEvent('COPY_ATTEMPT');
      return false;
    });

    // Prevent cut
    examContainer.addEventListener('cut', (e) => {
      e.preventDefault();
      reportSecurityEvent('CUT_ATTEMPT');
      return false;
    });

    // Prevent paste
    examContainer.addEventListener('paste', (e) => {
      e.preventDefault();
      reportSecurityEvent('PASTE_ATTEMPT');
      return false;
    });
  }

  function enableTabSwitchDetection() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        reportSecurityEvent('TAB_SWITCH', { action: 'hidden' });
      }
    });

    window.addEventListener('blur', () => {
      reportSecurityEvent('WINDOW_BLUR', { action: 'unfocused' });
    });
  }

  function enableFullscreenMonitoring() {
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        reportSecurityEvent('FULLSCREEN_EXIT');
      }
    });

    const requestFullscreenBtn = document.getElementById('btn-request-fullscreen');
    if (requestFullscreenBtn) {
      requestFullscreenBtn.addEventListener('click', () => {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        }
      });
    }
  }

  return {
    init,
    reportSecurityEvent
  };
})();
