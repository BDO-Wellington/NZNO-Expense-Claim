/**
 * Toast Notification Module
 * Purpose: Display slide-in toast notifications for user feedback
 * Author: Claude Code
 * Date: December 2025
 *
 * Features:
 * - Slide-in animation from right
 * - Auto-dismiss with progress bar (5 seconds for success)
 * - Multiple notification types (success, error, warning, info)
 * - NZNO brand color integration
 * - Accessibility compliant with aria-live
 */

/**
 * Toast configuration constants
 */
const TOAST_CONFIG = {
  SUCCESS_DURATION: 5000,
  ERROR_DURATION: 0, // No auto-dismiss for errors
  WARNING_DURATION: 7000,
  INFO_DURATION: 5000,
  ANIMATION_DURATION: 300,
  MAX_TOASTS: 5
};

/**
 * Active toast elements for management
 */
let activeToasts = [];

/**
 * Creates an SVG icon element
 * @param {string} type - Icon type (success, error, warning, info, close)
 * @returns {SVGElement} The SVG element
 */
function createIcon(type) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', type === 'close' ? '14' : '20');
  svg.setAttribute('height', type === 'close' ? '14' : '20');
  svg.setAttribute('viewBox', type === 'close' ? '0 0 14 14' : '0 0 20 20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');

  switch (type) {
    case 'success':
      path.setAttribute('d', 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z');
      break;
    case 'error':
      path.setAttribute('d', 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z');
      break;
    case 'warning':
      path.setAttribute('d', 'M1 18H19L10 2L1 18ZM11 16H9V14H11V16ZM11 12H9V8H11V12Z');
      break;
    case 'info':
      path.setAttribute('d', 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z');
      break;
    case 'close':
      path.setAttribute('d', 'M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z');
      break;
  }

  svg.appendChild(path);
  return svg;
}

/**
 * Gets or creates the toast container element
 * @returns {HTMLElement} The toast container
 */
function getToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Creates a toast element using safe DOM methods
 * @param {string} message - The toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
 * @returns {HTMLElement} The toast element
 */
function createToastElement(message, type, duration) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  // Create icon container
  const iconDiv = document.createElement('div');
  iconDiv.className = 'toast-icon';
  iconDiv.appendChild(createIcon(type));
  toast.appendChild(iconDiv);

  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'toast-content';

  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message; // Safe: uses textContent
  contentDiv.appendChild(messageSpan);
  toast.appendChild(contentDiv);

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.setAttribute('type', 'button');
  closeBtn.appendChild(createIcon('close'));
  toast.appendChild(closeBtn);

  // Create progress bar if needed
  if (duration > 0) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'toast-progress';

    const progressBar = document.createElement('div');
    progressBar.className = 'toast-progress-bar';
    progressDiv.appendChild(progressBar);
    toast.appendChild(progressDiv);
  }

  return toast;
}

/**
 * Shows a toast notification
 * @param {string} message - The notification message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {object} options - Optional configuration
 * @param {number} options.duration - Custom duration in ms (0 for no auto-dismiss)
 * @returns {HTMLElement} The toast element
 */
export function showToast(message, type = 'info', options = {}) {
  const container = getToastContainer();

  // Get duration based on type or custom option
  let duration;
  if (typeof options.duration === 'number') {
    duration = options.duration;
  } else {
    switch (type) {
      case 'success':
        duration = TOAST_CONFIG.SUCCESS_DURATION;
        break;
      case 'error':
        duration = TOAST_CONFIG.ERROR_DURATION;
        break;
      case 'warning':
        duration = TOAST_CONFIG.WARNING_DURATION;
        break;
      default:
        duration = TOAST_CONFIG.INFO_DURATION;
    }
  }

  // Remove oldest toast if at max
  if (activeToasts.length >= TOAST_CONFIG.MAX_TOASTS) {
    dismissToast(activeToasts[0]);
  }

  // Create and add toast
  const toast = createToastElement(message, type, duration);
  container.appendChild(toast);
  activeToasts.push(toast);

  // Trigger slide-in animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Setup close button handler
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => dismissToast(toast));
  }

  // Setup auto-dismiss with progress bar
  if (duration > 0) {
    const progressBar = toast.querySelector('.toast-progress-bar');
    if (progressBar) {
      progressBar.style.animationDuration = `${duration}ms`;
      progressBar.classList.add('toast-progress-active');
    }

    toast._dismissTimeout = setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  return toast;
}

/**
 * Dismisses a toast notification
 * @param {HTMLElement} toast - The toast element to dismiss
 */
export function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;

  // Clear timeout if exists
  if (toast._dismissTimeout) {
    clearTimeout(toast._dismissTimeout);
  }

  // Remove from active toasts
  const index = activeToasts.indexOf(toast);
  if (index > -1) {
    activeToasts.splice(index, 1);
  }

  // Trigger slide-out animation
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-hiding');

  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, TOAST_CONFIG.ANIMATION_DURATION);
}

/**
 * Dismisses all active toasts
 */
export function dismissAllToasts() {
  [...activeToasts].forEach(toast => dismissToast(toast));
}

/**
 * Shows a success toast notification
 * @param {string} message - The notification message
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.duration] - Custom duration in ms (default: 5000)
 * @returns {HTMLElement} The toast element
 */
export function showSuccess(message, options = {}) {
  return showToast(message, 'success', options);
}

/**
 * Shows an error toast notification
 * @param {string} message - The notification message
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.duration] - Custom duration in ms (default: 0, no auto-dismiss)
 * @returns {HTMLElement} The toast element
 */
export function showError(message, options = {}) {
  return showToast(message, 'error', options);
}

/**
 * Shows a warning toast notification
 * @param {string} message - The notification message
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.duration] - Custom duration in ms (default: 7000)
 * @returns {HTMLElement} The toast element
 */
export function showWarning(message, options = {}) {
  return showToast(message, 'warning', options);
}

/**
 * Shows an info toast notification
 * @param {string} message - The notification message
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.duration] - Custom duration in ms (default: 5000)
 * @returns {HTMLElement} The toast element
 */
export function showInfo(message, options = {}) {
  return showToast(message, 'info', options);
}

/**
 * Gets the count of active toasts
 * @returns {number} Number of active toasts
 */
export function getActiveToastCount() {
  return activeToasts.length;
}

/**
 * Resets the toast system (mainly for testing)
 */
export function resetToasts() {
  dismissAllToasts();
  const container = document.getElementById('toast-container');
  if (container) {
    container.remove();
  }
  activeToasts = [];
}

// Export configuration for testing
export { TOAST_CONFIG };
