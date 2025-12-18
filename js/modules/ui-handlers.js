/**
 * UI Handlers Module
 * Purpose: DOM manipulation, event handling, and user interface updates
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { calculateVehicleAmount, EXPENSE_TYPES } from './expense-types.js';
import { formatDate, getTodayDate } from './utils.js';
import { showDeleteConfirm } from './modal.js';

/**
 * Generates the standard expenses table rows dynamically.
 * @param {Array<{name: string, accountCode: string}>} expenseTypes - Array of expense types
 * @returns {void}
 */
export function generateExpenseTable(expenseTypes) {
  const tableBody = document.querySelector('#StandardExpensesTable tbody');
  if (!tableBody) return;

  // Clear existing rows safely
  tableBody.textContent = '';

  expenseTypes.forEach(type => {
    const fieldName = type.name.toLowerCase().replace(/\s+/g, '');

    // Create row
    const row = document.createElement('tr');

    // Description cell with name and account code
    const descCell = document.createElement('td');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'expense-name';
    nameSpan.textContent = type.name;
    const codeSpan = document.createElement('span');
    codeSpan.className = 'expense-code';
    codeSpan.textContent = ` (${type.accountCode})`;
    descCell.appendChild(nameSpan);
    descCell.appendChild(codeSpan);

    // Amount cell
    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'form-control';
    amountInput.name = `${fieldName}Amount`;
    amountInput.step = '0.01';
    amountInput.placeholder = '0.00';
    amountInput.setAttribute('aria-label', `${type.name} amount`);
    amountCell.appendChild(amountInput);

    // Attachment cell
    const attachCell = document.createElement('td');
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.className = 'form-control-file';
    attachInput.name = `${fieldName}Attachments`;
    attachInput.multiple = true;
    attachInput.setAttribute('aria-label', `${type.name} attachment`);
    attachCell.appendChild(attachInput);

    row.appendChild(descCell);
    row.appendChild(amountCell);
    row.appendChild(attachCell);
    tableBody.appendChild(row);

    // Disable scroll wheel on number input
    disableScrollOnInput(amountInput);
  });
}

/**
 * Adds a new row to the Other Expenses table with animation.
 * @returns {void}
 */
export function addOtherExpenseRow() {
  const tableBody = document.getElementById('otherExpensesBody');
  if (!tableBody) return;

  const newRow = document.createElement('tr');
  newRow.classList.add('row-entering');

  // Create cells using DOM methods for security
  const descCell = document.createElement('td');
  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.className = 'form-control';
  descInput.name = 'other_description[]';
  descInput.setAttribute('aria-label', 'Other expense description');
  descCell.appendChild(descInput);

  const amountCell = document.createElement('td');
  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.className = 'form-control';
  amountInput.name = 'other_amount[]';
  amountInput.step = '0.01';
  amountInput.setAttribute('aria-label', 'Other expense amount');
  amountCell.appendChild(amountInput);

  const attachCell = document.createElement('td');
  const attachInput = document.createElement('input');
  attachInput.type = 'file';
  attachInput.className = 'form-control-file';
  attachInput.name = 'other_attachment[]';
  attachInput.multiple = true;
  attachInput.setAttribute('aria-label', 'Other expense attachment');
  attachCell.appendChild(attachInput);

  const actionCell = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger btn-sm';
  removeBtn.setAttribute('data-action', 'remove-row');
  removeBtn.textContent = 'Remove';
  actionCell.appendChild(removeBtn);

  newRow.appendChild(descCell);
  newRow.appendChild(amountCell);
  newRow.appendChild(attachCell);
  newRow.appendChild(actionCell);

  tableBody.appendChild(newRow);

  // Disable scroll wheel on the newly added number input
  disableScrollOnInput(amountInput);

  // Remove animation class after animation completes
  setTimeout(() => {
    newRow.classList.remove('row-entering');
  }, 200);

  // Focus the description input
  descInput.focus();
}

/**
 * Removes a row from the Other Expenses table with confirmation.
 * @param {HTMLElement} button - The remove button element
 * @returns {Promise<void>}
 */
export async function removeExpenseRow(button) {
  const row = button.closest('tr');
  if (!row) return;

  // Check if row has any data entered
  const descInput = row.querySelector('input[name="other_description[]"]');
  const amountInput = row.querySelector('input[name="other_amount[]"]');
  const fileInput = row.querySelector('input[name="other_attachment[]"]');

  const hasData = (descInput && descInput.value.trim()) ||
                  (amountInput && amountInput.value) ||
                  (fileInput && fileInput.files && fileInput.files.length > 0);

  // Only show confirmation if row has data
  if (hasData) {
    const confirmed = await showDeleteConfirm('this expense row');
    if (!confirmed) return;
  }

  // Animate row removal
  row.classList.add('row-removing');
  row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  row.style.opacity = '0';
  row.style.transform = 'translateX(20px)';

  setTimeout(() => {
    row.remove();
  }, 200);
}

/**
 * Updates the vehicle amount based on kilometres input.
 * @param {number} kilometres - Number of kilometres
 * @returns {void}
 */
export function updateVehicleAmount(kilometres) {
  const vehicleAmountInput = document.getElementById('vehicleAmount');
  if (vehicleAmountInput) {
    const amount = calculateVehicleAmount(kilometres);
    vehicleAmountInput.value = amount.toFixed(2);
  }
}

/**
 * Shows a Bootstrap alert message in the alert container.
 * @param {string} message - The alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 * @returns {void}
 */
export function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) {
    // Clear existing content safely
    alertContainer.textContent = '';

    // Create alert element using safe DOM methods (prevents XSS)
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);

    if (type === 'success') {
      setTimeout(() => { alertContainer.textContent = ''; }, 5000);
    }
  }
}

/**
 * Shows an attachment error message.
 * @param {string} message - The error message
 * @returns {void}
 */
export function showAttachmentError(message) {
  const errorContainer = document.getElementById('attachmentsError');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('d-none');
  }
}

/**
 * Hides the attachment error message.
 * @returns {void}
 */
export function hideAttachmentError() {
  const errorContainer = document.getElementById('attachmentsError');
  if (errorContainer) {
    errorContainer.classList.add('d-none');
  }
}

/**
 * Sets the form to view-only mode after successful submission.
 * @param {HTMLFormElement} form - The form element
 * @returns {void}
 */
export function setFormToViewMode(form) {
  try {
    Array.from(form.elements).forEach((element) => {
      if (element.tagName.toLowerCase() !== 'button') {
        element.disabled = true;
      }
    });
    form.querySelectorAll('input[type="file"]').forEach(input => { input.disabled = true; });
    form.querySelectorAll('a').forEach(link => {
      link.onclick = (e) => e.preventDefault();
      link.style.pointerEvents = 'none';
      link.style.color = '#6c757d';
    });
    form.querySelectorAll('.btn, .custom-control-input').forEach(ctrl => { ctrl.disabled = true; });
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) { submitButton.style.display = 'none'; }
  } catch (err) {
    console.error('[ExpenseClaim] Error setting form to view mode:', err);
  }
}

/**
 * Sets the default date to today for the expense date input.
 * @returns {void}
 */
export function setDefaultDate() {
  const dateInput = document.getElementById('expenseDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
  }
}

/**
 * Renders attachment filenames for display in print/PDF mode.
 * @returns {void}
 */
export function renderAttachmentFilenames() {
  document.querySelectorAll('input[type="file"]').forEach(input => {
    let span = input.parentNode.querySelector('.attachment-filename');
    if (!span) {
      span = document.createElement('span');
      span.className = 'attachment-filename';
      span.style.display = 'none';
      input.parentNode.appendChild(span);
    }
    const files = input.files;
    if (files && files.length > 0) {
      span.textContent = Array.from(files).map(f => f.name).join(', ');
    } else {
      span.textContent = '';
    }
  });
}

/**
 * Adds print-friendly class to the main container.
 * @returns {void}
 */
export function enablePrintMode() {
  const main = document.querySelector('main.container');
  if (main) { main.classList.add('print-friendly'); }
  document.querySelectorAll('.page-break').forEach(el => { el.style.display = 'block'; });
  window.scrollTo(0, 0);
}

/**
 * Removes print-friendly class from the main container.
 * @returns {void}
 */
export function disablePrintMode() {
  const main = document.querySelector('main.container');
  if (main) { main.classList.remove('print-friendly'); }
  document.body.classList.remove('print-friendly');
}

/**
 * Hides the PDF download button (used in debug mode).
 * @returns {void}
 */
export function hidePdfButton() {
  const pdfBtn = document.getElementById('downloadPdfButton');
  if (pdfBtn) { pdfBtn.style.display = 'none'; }
}

/**
 * Disables scroll wheel on a specific number input to prevent accidental changes.
 * @param {HTMLInputElement} input - The number input element
 * @returns {void}
 */
export function disableScrollOnInput(input) {
  if (input && input.type === 'number') {
    input.addEventListener('wheel', function(e) {
      e.preventDefault();
    }, { passive: false });
  }
}

/**
 * Disables scroll wheel on all number inputs in the form.
 * @returns {void}
 */
export function disableScrollOnNumberInputs() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    disableScrollOnInput(input);
  });
}

/**
 * Sets up all event listeners for the application.
 * @param {object} handlers - Object containing event handler functions
 * @returns {void}
 */
export function setupEventListeners(handlers) {
  const kmsInput = document.getElementById('kms');
  if (kmsInput) {
    kmsInput.addEventListener('input', function() {
      const kms = parseFloat(this.value) || 0;
      updateVehicleAmount(kms);
    });
  }
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="add-other-expense"]')) {
      e.preventDefault();
      addOtherExpenseRow();
    }
    if (e.target.matches('[data-action="remove-row"]')) {
      e.preventDefault();
      removeExpenseRow(e.target);
    }
  });
  document.addEventListener('change', function(e) {
    if (e.target.type === 'file') { renderAttachmentFilenames(); }
  }, true);
  window.addEventListener('beforeprint', function() { renderAttachmentFilenames(); });
  if (handlers && handlers.onSubmit) {
    const form = document.getElementById('expenseForm');
    if (form) { form.addEventListener('submit', handlers.onSubmit); }
  }
  if (handlers && handlers.onPdfDownload) {
    const pdfBtn = document.getElementById('downloadPdfButton');
    if (pdfBtn) { pdfBtn.addEventListener('click', handlers.onPdfDownload); }
  }
  // Disable scroll wheel on all number inputs
  disableScrollOnNumberInputs();
}

/**
 * Initializes the UI on page load.
 * @param {object} config - Application configuration
 * @returns {void}
 */
export function initializeUI(config) {
  disablePrintMode();
  setDefaultDate();
  renderAttachmentFilenames();
  generateExpenseTable(EXPENSE_TYPES);
  disableScrollOnNumberInputs();
  if (config && config.DEBUG_MODE && config.DEBUG_MODE.toUpperCase() === 'DEBUG') {
    hidePdfButton();
  }
}

// ============================================
// Phase 1: Button Loading States
// ============================================

/**
 * Sets a button to loading state with spinner
 * @param {HTMLButtonElement} button - The button element
 * @param {boolean} loading - Whether to show loading state
 * @returns {void}
 */
export function setButtonLoading(button, loading) {
  if (!button) return;

  if (loading) {
    // Store original text
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    // Disable and set aria-busy
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('btn-loading');

    // Create spinner element
    const spinner = document.createElement('span');
    spinner.className = 'spinner spinner-sm spinner-white';
    spinner.setAttribute('aria-hidden', 'true');

    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'btn-loading-text';
    textSpan.textContent = 'Loading...';

    // Clear and add new content
    button.textContent = '';
    button.appendChild(spinner);
    button.appendChild(textSpan);
  } else {
    // Restore original state
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.classList.remove('btn-loading');

    // Restore original text
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/**
 * Sets a button to loading state with custom text
 * @param {HTMLButtonElement} button - The button element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} loadingText - Custom loading text
 * @returns {void}
 */
export function setButtonLoadingWithText(button, loading, loadingText = 'Loading...') {
  if (!button) return;

  if (loading) {
    // Store original text
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    // Disable and set aria-busy
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('btn-loading');

    // Create spinner element
    const spinner = document.createElement('span');
    spinner.className = 'spinner spinner-sm spinner-white';
    spinner.setAttribute('aria-hidden', 'true');

    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'btn-loading-text';
    textSpan.textContent = loadingText;

    // Clear and add new content
    button.textContent = '';
    button.appendChild(spinner);
    button.appendChild(textSpan);
  } else {
    setButtonLoading(button, false);
  }
}

// ============================================
// Phase 1: Progress Overlay
// ============================================

/** @type {HTMLElement|null} */
let progressOverlay = null;

/**
 * Creates the progress overlay element
 * @returns {HTMLElement} The progress overlay element
 */
function createProgressOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'progress-overlay';
  overlay.id = 'progress-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'progress-title');

  const content = document.createElement('div');
  content.className = 'progress-content';

  // Spinner icon
  const iconDiv = document.createElement('div');
  iconDiv.className = 'progress-icon';
  const spinner = document.createElement('span');
  spinner.className = 'spinner spinner-lg spinner-primary';
  spinner.setAttribute('aria-hidden', 'true');
  iconDiv.appendChild(spinner);
  content.appendChild(iconDiv);

  // Title
  const title = document.createElement('h3');
  title.className = 'progress-title';
  title.id = 'progress-title';
  title.textContent = 'Processing';
  content.appendChild(title);

  // Status text
  const status = document.createElement('p');
  status.className = 'progress-status';
  status.id = 'progress-status';
  status.textContent = 'Please wait...';
  content.appendChild(status);

  // Progress bar container
  const barContainer = document.createElement('div');
  barContainer.className = 'progress-bar-container';
  const bar = document.createElement('div');
  bar.className = 'progress-bar-indeterminate';
  barContainer.appendChild(bar);
  content.appendChild(barContainer);

  overlay.appendChild(content);
  return overlay;
}

/**
 * Shows the progress overlay with a message
 * @param {string} title - The title text
 * @param {string} status - The status message
 * @returns {void}
 */
export function showProgressOverlay(title = 'Processing', status = 'Please wait...') {
  if (!progressOverlay) {
    progressOverlay = createProgressOverlay();
    document.body.appendChild(progressOverlay);
  }

  const titleEl = progressOverlay.querySelector('#progress-title');
  const statusEl = progressOverlay.querySelector('#progress-status');

  if (titleEl) titleEl.textContent = title;
  if (statusEl) statusEl.textContent = status;

  // Trigger reflow for animation
  progressOverlay.offsetHeight;
  progressOverlay.classList.add('visible');

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Updates the progress overlay status message
 * @param {string} status - The new status message
 * @returns {void}
 */
export function updateProgressStatus(status) {
  if (progressOverlay) {
    const statusEl = progressOverlay.querySelector('#progress-status');
    if (statusEl) statusEl.textContent = status;
  }
}

/**
 * Hides the progress overlay
 * @returns {void}
 */
export function hideProgressOverlay() {
  if (progressOverlay) {
    progressOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }
}

/**
 * Removes the progress overlay from DOM
 * @returns {void}
 */
export function destroyProgressOverlay() {
  if (progressOverlay && progressOverlay.parentNode) {
    progressOverlay.parentNode.removeChild(progressOverlay);
    progressOverlay = null;
    document.body.style.overflow = '';
  }
}
