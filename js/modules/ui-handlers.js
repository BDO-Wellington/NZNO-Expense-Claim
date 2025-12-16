/**
 * UI Handlers Module
 * Purpose: DOM manipulation, event handling, and user interface updates
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { calculateVehicleAmount, EXPENSE_TYPES } from './expense-types.js';
import { formatDate, getTodayDate } from './utils.js';

/**
 * Generates the standard expenses table rows dynamically.
 * @param {Array<{name: string, accountCode: string}>} expenseTypes - Array of expense types
 * @returns {void}
 */
export function generateExpenseTable(expenseTypes) {
  const tableBody = document.querySelector('#StandardExpensesTable tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = expenseTypes.map(type => {
    const fieldName = type.name.toLowerCase().replace(/\s+/g, '');
    return `<tr><td>${type.name}</td><td><input type="number" class="form-control" name="${fieldName}Amount" step="0.01"></td><td><input type="file" class="form-control-file" name="${fieldName}Attachments" multiple></td></tr>`;
  }).join('');
}

/**
 * Adds a new row to the Other Expenses table.
 * @returns {void}
 */
export function addOtherExpenseRow() {
  const tableBody = document.getElementById('otherExpensesBody');
  if (!tableBody) return;
  
  const newRow = document.createElement('tr');
  newRow.innerHTML = '<td><input type="text" class="form-control" name="other_description[]" aria-label="Other expense description"></td><td><input type="number" class="form-control" name="other_amount[]" step="0.01" aria-label="Other expense amount"></td><td><input type="file" class="form-control-file" name="other_attachment[]" multiple aria-label="Other expense attachment"></td><td><button type="button" class="btn btn-danger btn-sm" data-action="remove-row">Remove</button></td>';
  tableBody.appendChild(newRow);
  // Disable scroll wheel on the newly added number input
  const numberInput = newRow.querySelector('input[type="number"]');
  if (numberInput) {
    disableScrollOnInput(numberInput);
  }
}

/**
 * Removes a row from the Other Expenses table.
 * @param {HTMLElement} button - The remove button element
 * @returns {void}
 */
export function removeExpenseRow(button) {
  const row = button.closest('tr');
  if (row) row.remove();
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
    alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    if (type === 'success') {
      setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
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
