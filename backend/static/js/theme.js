/**
 * KDTechX Theme Engine
 * Controls Dark, Light, and System themes without initial page flash.
 */
(function() {
  const THEME_KEY = 'kdtechx_theme_preference';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    updateToggleIcons(theme);
  }

  function updateToggleIcons(theme) {
    const toggles = document.querySelectorAll('.kd-theme-toggle');
    toggles.forEach(toggle => {
      const icon = toggle.querySelector('i');
      if (icon) {
        if (theme === 'light') {
          icon.className = 'bi bi-moon-fill';
          toggle.setAttribute('title', 'Switch to dark mode');
        } else {
          icon.className = 'bi bi-sun-fill';
          toggle.setAttribute('title', 'Switch to light mode');
        }
      }
    });
  }

  // Execute immediately to prevent flash of wrong theme
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Global toggle function
  window.KDTechXTheme = {
    get: getPreferredTheme,
    set: function(theme) {
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    },
    toggle: function() {
      const current = getPreferredTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.set(next);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleIcons(getPreferredTheme());
    document.querySelectorAll('.kd-theme-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.KDTechXTheme.toggle();
      });
    });
  });
})();
