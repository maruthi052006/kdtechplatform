/**
 * KDTechX Main Core JavaScript
 * Global utilities: CSRF token retrieval, toast notifications, loading states, command palette.
 */

// CSRF Cookie Helper for Django
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Toast Notifications System
window.KDTechXToast = {
  show: function(message, type = 'info', duration = 4000) {
    let container = document.getElementById('kd-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kd-toast-container';
      container.className = 'kd-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `kd-toast ${type}`;

    let iconClass = 'bi-info-circle-fill text-primary';
    if (type === 'success') iconClass = 'bi-check-circle-fill text-success';
    if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill text-warning';
    if (type === 'danger' || type === 'error') iconClass = 'bi-x-circle-fill text-danger';

    toast.innerHTML = `
      <i class="bi ${iconClass} fs-5"></i>
      <span class="flex-grow-1">${message}</span>
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close" style="font-size: 0.7rem;"></button>
    `;

    toast.querySelector('.btn-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }
};

// Form Loading State Enhancer
document.addEventListener('DOMContentLoaded', () => {
  // Enhance forms on submit
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled && !this.classList.contains('no-loading-state')) {
        submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Processing...
        `;
      }
    });
  });

  // Auto-dismiss alert messages after 5 seconds
  document.querySelectorAll('.alert.alert-dismissible').forEach(alert => {
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // Command Palette Keyboard Shortcut (Ctrl+K / Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const paletteModal = document.getElementById('kdCommandPaletteModal');
      if (paletteModal && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(paletteModal);
        modal.toggle();
      }
    }
  });
});
