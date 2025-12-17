/**
 * Modal Dialog Module
 * Purpose: Reusable confirmation dialogs with focus trapping
 * Author: Claude Code
 * Date: December 2025
 *
 * Features:
 * - Focus trapping within modal
 * - ESC key to close
 * - Click outside to dismiss
 * - Promise-based async/await interface
 * - Warning icon for destructive actions
 * - Accessibility compliant
 */

/**
 * Modal configuration
 */
const MODAL_CONFIG = {
  ANIMATION_DURATION: 200
};

/**
 * Currently active modal element
 * @type {HTMLElement|null}
 */
let activeModal = null;

/**
 * Element that had focus before modal opened
 * @type {HTMLElement|null}
 */
let previouslyFocusedElement = null;

/**
 * Creates an SVG warning icon
 * @returns {SVGElement} The SVG element
 */
function createWarningIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '48');
  svg.setAttribute('height', '48');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('modal-warning-icon');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z');
  path.setAttribute('fill', 'currentColor');

  svg.appendChild(path);
  return svg;
}

/**
 * Creates modal element structure using safe DOM methods
 * @param {object} options - Modal options
 * @returns {HTMLElement} The modal element
 */
function createModalElement(options) {
  const { title, message, confirmText, cancelText, type } = options;

  // Create backdrop
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');
  modal.setAttribute('aria-describedby', 'modal-message');

  // Create content container
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.setAttribute('tabindex', '-1');

  // Add warning icon for destructive modals
  if (type === 'danger' || type === 'warning') {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'modal-icon';
    iconContainer.appendChild(createWarningIcon());
    content.appendChild(iconContainer);
  }

  // Title
  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.id = 'modal-title';
  titleEl.textContent = title;
  content.appendChild(titleEl);

  // Message
  const messageEl = document.createElement('p');
  messageEl.className = 'modal-message';
  messageEl.id = 'modal-message';
  messageEl.textContent = message;
  content.appendChild(messageEl);

  // Button container
  const buttons = document.createElement('div');
  buttons.className = 'modal-buttons';

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary modal-cancel';
  cancelBtn.type = 'button';
  cancelBtn.textContent = cancelText;
  buttons.appendChild(cancelBtn);

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = type === 'danger' ? 'btn btn-danger modal-confirm' : 'btn btn-primary modal-confirm';
  confirmBtn.type = 'button';
  confirmBtn.textContent = confirmText;
  buttons.appendChild(confirmBtn);

  content.appendChild(buttons);
  modal.appendChild(content);

  return modal;
}

/**
 * Gets all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
function getFocusableElements(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ];
  return Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
}

/**
 * Handles focus trapping within the modal
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleFocusTrap(event) {
  if (!activeModal || event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(activeModal);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab: going backwards
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: going forwards
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * Handles ESC key to close modal
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleEscKey(event) {
  if (event.key === 'Escape' && activeModal) {
    closeModal(false);
  }
}

/**
 * Closes the active modal
 * @param {boolean} confirmed - Whether the action was confirmed
 */
function closeModal(confirmed) {
  if (!activeModal) return;

  // Trigger close animation
  activeModal.classList.remove('modal-visible');

  // Remove event listeners
  document.removeEventListener('keydown', handleFocusTrap);
  document.removeEventListener('keydown', handleEscKey);

  // Restore body scroll
  document.body.style.overflow = '';

  // Remove modal after animation
  setTimeout(() => {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
    }
    activeModal = null;

    // Restore focus to previous element
    if (previouslyFocusedElement && previouslyFocusedElement.focus) {
      previouslyFocusedElement.focus();
    }
    previouslyFocusedElement = null;
  }, MODAL_CONFIG.ANIMATION_DURATION);

  // Resolve the promise
  if (activeModal && activeModal._resolve) {
    activeModal._resolve(confirmed);
  }
}

/**
 * Shows a confirmation modal dialog
 * @param {object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} [options.confirmText='Confirm'] - Confirm button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {string} [options.type='default'] - Modal type ('default', 'danger', 'warning')
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(options) {
  return new Promise((resolve) => {
    // Close any existing modal
    if (activeModal) {
      closeModal(false);
    }

    const modalOptions = {
      title: options.title || 'Confirm',
      message: options.message || 'Are you sure?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'default'
    };

    // Store previously focused element
    previouslyFocusedElement = document.activeElement;

    // Create and add modal
    const modal = createModalElement(modalOptions);
    modal._resolve = resolve;
    document.body.appendChild(modal);
    activeModal = modal;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Trigger show animation
    requestAnimationFrame(() => {
      modal.classList.add('modal-visible');
    });

    // Add event listeners
    document.addEventListener('keydown', handleFocusTrap);
    document.addEventListener('keydown', handleEscKey);

    // Button click handlers
    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');

    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(false);
      }
    });

    // Focus first focusable element (cancel button for safety)
    setTimeout(() => {
      cancelBtn.focus();
    }, 50);
  });
}

/**
 * Shows a delete confirmation modal
 * @param {string} itemName - Name of item being deleted
 * @returns {Promise<boolean>} Resolves to true if confirmed
 */
export function showDeleteConfirm(itemName = 'this item') {
  return showConfirmModal({
    title: 'Confirm Removal',
    message: `Are you sure you want to remove ${itemName}? This action cannot be undone.`,
    confirmText: 'Remove',
    cancelText: 'Keep',
    type: 'danger'
  });
}

/**
 * Shows a warning modal
 * @param {string} title - Warning title
 * @param {string} message - Warning message
 * @returns {Promise<boolean>} Resolves to true if confirmed
 */
export function showWarningModal(title, message) {
  return showConfirmModal({
    title,
    message,
    confirmText: 'Continue',
    cancelText: 'Cancel',
    type: 'warning'
  });
}

/**
 * Checks if a modal is currently open
 * @returns {boolean} True if modal is open
 */
export function isModalOpen() {
  return activeModal !== null;
}

/**
 * Force closes any open modal
 */
export function forceCloseModal() {
  if (activeModal) {
    closeModal(false);
  }
}

// Export config for testing
export { MODAL_CONFIG };
