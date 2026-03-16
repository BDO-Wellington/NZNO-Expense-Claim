/**
 * UI Handlers Module
 * Purpose: DOM manipulation, event handling, and user interface updates
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { calculateVehicleAmount, EXPENSE_TYPES, STAFF_ONLY_EXPENSES, VEHICLE_RATES, DEFAULT_VEHICLE_TYPE, getVehicleRate } from './expense-types.js';
import { formatDate, getTodayDate } from './utils.js';
import { showDeleteConfirm } from './modal.js';

// ============================================
// Standard Expenses Table Generation
// ============================================

/**
 * Generates the standard expenses table rows dynamically based on renderType.
 * @param {Array} expenseTypes - Array of expense type definitions
 * @param {string} [claimantType='member'] - Current claimant type for staff-only rows
 * @returns {void}
 */
export function generateExpenseTable(expenseTypes, claimantType = 'member') {
  const tableBody = document.querySelector('#StandardExpensesTable tbody');
  if (!tableBody) return;

  // Clear existing rows safely
  tableBody.textContent = '';

  // Determine which types to render
  let typesToRender = [...expenseTypes];
  if (claimantType === 'staff') {
    typesToRender = [...typesToRender, ...STAFF_ONLY_EXPENSES];
  }

  typesToRender.forEach(type => {
    switch (type.renderType) {
      case 'accommodation':
        renderAccommodationRow(tableBody, type);
        break;
      case 'meal-group':
        renderMealGroupRows(tableBody, type);
        break;
      case 'nights-allowance':
        renderNightsAllowanceRow(tableBody, type);
        break;
      case 'standard':
      default:
        renderStandardRow(tableBody, type);
        break;
    }
  });
}

/**
 * Appends a "Clear" button next to a file input that clears the selected files.
 * The button is only visible when files are selected.
 * @param {HTMLElement} container - The parent element (td) to append the button to
 * @param {HTMLInputElement} fileInput - The file input element
 * @returns {void}
 */
function appendClearAttachmentButton(container, fileInput) {
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-danger btn-sm mt-1 d-none';
  clearBtn.textContent = 'Clear';
  clearBtn.setAttribute('aria-label', 'Clear attachment');

  clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    clearBtn.classList.add('d-none');
    renderAttachmentFilenames();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      clearBtn.classList.remove('d-none');
    } else {
      clearBtn.classList.add('d-none');
    }
  });

  container.appendChild(clearBtn);
}

/**
 * Renders a standard expense row (amount + notes + attachment).
 * @param {HTMLElement} tableBody - Table body element
 * @param {object} type - Expense type definition
 * @returns {void}
 */
function renderStandardRow(tableBody, type) {
  const fieldName = type.name.toLowerCase().replace(/\s+/g, '');
  const row = document.createElement('tr');
  row.setAttribute('data-account-code', type.accountCode);
  row.setAttribute('data-render-type', 'standard');

  // Description cell
  const descCell = document.createElement('td');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'expense-name';
  nameSpan.textContent = type.name;
  descCell.appendChild(nameSpan);
  if (type.note) {
    const noteSpan = document.createElement('small');
    noteSpan.className = 'form-text text-muted';
    noteSpan.textContent = ` (${type.note})`;
    descCell.appendChild(noteSpan);
  }

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

  // Notes cell
  const notesCell = document.createElement('td');
  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.className = 'form-control';
  notesInput.name = `${fieldName}Notes`;
  notesInput.placeholder = 'Optional';
  notesInput.setAttribute('aria-label', `${type.name} notes`);
  notesCell.appendChild(notesInput);

  // Attachment cell
  const attachCell = document.createElement('td');
  const attachInput = document.createElement('input');
  attachInput.type = 'file';
  attachInput.className = 'form-control-file';
  attachInput.name = `${fieldName}Attachments`;
  attachInput.multiple = true;
  attachInput.setAttribute('aria-label', `${type.name} attachment`);
  attachCell.appendChild(attachInput);
  appendClearAttachmentButton(attachCell, attachInput);

  row.appendChild(descCell);
  row.appendChild(amountCell);
  row.appendChild(notesCell);
  row.appendChild(attachCell);
  tableBody.appendChild(row);

  disableScrollOnInput(amountInput);
}

/**
 * Renders the accommodation row with nights x price per night calculation.
 * @param {HTMLElement} tableBody - Table body element
 * @param {object} type - Expense type definition
 * @returns {void}
 */
function renderAccommodationRow(tableBody, type) {
  const row = document.createElement('tr');
  row.setAttribute('data-account-code', type.accountCode);
  row.setAttribute('data-render-type', 'accommodation');

  // Description cell
  const descCell = document.createElement('td');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'expense-name';
  nameSpan.textContent = type.name;
  descCell.appendChild(nameSpan);

  // Amount cell - contains nights, price per night, and calculated total
  const amountCell = document.createElement('td');
  amountCell.className = 'accommodation-amount-cell';

  const nightsLabel = document.createElement('label');
  nightsLabel.textContent = 'Nights: ';
  nightsLabel.className = 'accommodation-inline-label';
  const nightsInput = document.createElement('input');
  nightsInput.type = 'number';
  nightsInput.className = 'form-control form-control-sm accommodation-input';
  nightsInput.name = 'accommodationNights';
  nightsInput.min = '0';
  nightsInput.step = '1';
  nightsInput.placeholder = '0';
  nightsInput.setAttribute('aria-label', 'Number of nights');

  const priceLabel = document.createElement('label');
  priceLabel.textContent = ' x $/Night: ';
  priceLabel.className = 'accommodation-inline-label';
  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.className = 'form-control form-control-sm accommodation-input';
  priceInput.name = 'accommodationPricePerNight';
  priceInput.step = '0.01';
  priceInput.placeholder = '0.00';
  priceInput.setAttribute('aria-label', 'Price per night');

  const equalsSpan = document.createElement('span');
  equalsSpan.textContent = ' = $';
  equalsSpan.className = 'accommodation-inline-label';
  const totalInput = document.createElement('input');
  totalInput.type = 'number';
  totalInput.className = 'form-control form-control-sm accommodation-input';
  totalInput.name = 'accommodationAmount';
  totalInput.readOnly = true;
  totalInput.placeholder = '0.00';
  totalInput.setAttribute('aria-label', 'Accommodation total amount');

  amountCell.appendChild(nightsLabel);
  amountCell.appendChild(nightsInput);
  amountCell.appendChild(priceLabel);
  amountCell.appendChild(priceInput);
  amountCell.appendChild(equalsSpan);
  amountCell.appendChild(totalInput);

  // Auto-calculate total
  const calcTotal = () => {
    const nights = parseFloat(nightsInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    totalInput.value = (nights * price).toFixed(2);
  };
  nightsInput.addEventListener('input', calcTotal);
  priceInput.addEventListener('input', calcTotal);

  // Notes cell
  const notesCell = document.createElement('td');
  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.className = 'form-control';
  notesInput.name = 'accommodationNotes';
  notesInput.placeholder = 'Optional';
  notesInput.setAttribute('aria-label', 'Accommodation notes');
  notesCell.appendChild(notesInput);

  // Attachment cell
  const attachCell = document.createElement('td');
  const attachInput = document.createElement('input');
  attachInput.type = 'file';
  attachInput.className = 'form-control-file';
  attachInput.name = 'accommodationAttachments';
  attachInput.multiple = true;
  attachInput.setAttribute('aria-label', 'Accommodation attachment');
  attachCell.appendChild(attachInput);
  appendClearAttachmentButton(attachCell, attachInput);

  row.appendChild(descCell);
  row.appendChild(amountCell);
  row.appendChild(notesCell);
  row.appendChild(attachCell);
  tableBody.appendChild(row);

  disableScrollOnInput(nightsInput);
  disableScrollOnInput(priceInput);
}

/**
 * Renders the meal group: a note banner row + Breakfast/Lunch/Dinner sub-rows.
 * @param {HTMLElement} tableBody - Table body element
 * @param {object} type - Expense type definition with subItems and maxNote
 * @returns {void}
 */
function renderMealGroupRows(tableBody, type) {
  // Note banner row
  if (type.maxNote) {
    const noteRow = document.createElement('tr');
    noteRow.className = 'meal-note-row';
    const noteCell = document.createElement('td');
    noteCell.colSpan = 4;
    const noteText = document.createElement('small');
    noteText.className = 'text-muted';
    noteText.textContent = `Meals ${type.maxNote}`;
    noteCell.appendChild(noteText);
    noteRow.appendChild(noteCell);
    tableBody.appendChild(noteRow);
  }

  // Sub-rows for each meal type
  type.subItems.forEach(subItem => {
    const fieldName = subItem.name.toLowerCase();
    const row = document.createElement('tr');
    row.setAttribute('data-account-code', subItem.accountCode);
    row.setAttribute('data-render-type', 'meal-item');

    // Description cell (indented)
    const descCell = document.createElement('td');
    descCell.className = 'meal-sub-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'expense-name';
    nameSpan.textContent = subItem.name;
    descCell.appendChild(nameSpan);
    if (subItem.maxAmount) {
      const maxSpan = document.createElement('small');
      maxSpan.className = 'form-text text-muted';
      maxSpan.textContent = ` (max $${subItem.maxAmount})`;
      descCell.appendChild(maxSpan);
    }

    // Amount cell
    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'form-control';
    amountInput.name = `${fieldName}Amount`;
    amountInput.step = '0.01';
    amountInput.placeholder = '0.00';
    amountInput.setAttribute('aria-label', `${subItem.name} amount`);
    amountCell.appendChild(amountInput);

    // Notes cell
    const notesCell = document.createElement('td');
    const notesInput = document.createElement('input');
    notesInput.type = 'text';
    notesInput.className = 'form-control';
    notesInput.name = `${fieldName}Notes`;
    notesInput.placeholder = 'Optional';
    notesInput.setAttribute('aria-label', `${subItem.name} notes`);
    notesCell.appendChild(notesInput);

    // Attachment cell
    const attachCell = document.createElement('td');
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.className = 'form-control-file';
    attachInput.name = `${fieldName}Attachments`;
    attachInput.multiple = true;
    attachInput.setAttribute('aria-label', `${subItem.name} attachment`);
    attachCell.appendChild(attachInput);
    appendClearAttachmentButton(attachCell, attachInput);

    row.appendChild(descCell);
    row.appendChild(amountCell);
    row.appendChild(notesCell);
    row.appendChild(attachCell);
    tableBody.appendChild(row);

    disableScrollOnInput(amountInput);
  });
}

/**
 * Renders the nights allowance row (staff only) with nights x rate calculation.
 * @param {HTMLElement} tableBody - Table body element
 * @param {object} type - Expense type definition with ratePerNight
 * @returns {void}
 */
function renderNightsAllowanceRow(tableBody, type) {
  const row = document.createElement('tr');
  row.setAttribute('data-account-code', type.accountCode);
  row.setAttribute('data-render-type', 'nights-allowance');

  // Description cell
  const descCell = document.createElement('td');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'expense-name';
  nameSpan.textContent = type.name;
  const rateNote = document.createElement('small');
  rateNote.className = 'form-text text-muted';
  rateNote.textContent = ` ($${type.ratePerNight}/night)`;
  descCell.appendChild(nameSpan);
  descCell.appendChild(rateNote);

  // Amount cell - nights input + calculated total
  const amountCell = document.createElement('td');
  amountCell.className = 'accommodation-amount-cell';

  const nightsLabel = document.createElement('label');
  nightsLabel.textContent = 'Nights: ';
  nightsLabel.className = 'accommodation-inline-label';
  const nightsInput = document.createElement('input');
  nightsInput.type = 'number';
  nightsInput.className = 'form-control form-control-sm accommodation-input';
  nightsInput.name = 'overnightAllowanceNights';
  nightsInput.min = '0';
  nightsInput.step = '1';
  nightsInput.placeholder = '0';
  nightsInput.setAttribute('aria-label', 'Number of nights for overnight allowance');

  const equalsSpan = document.createElement('span');
  equalsSpan.textContent = ` x $${type.ratePerNight} = $`;
  equalsSpan.className = 'accommodation-inline-label';
  const totalInput = document.createElement('input');
  totalInput.type = 'number';
  totalInput.className = 'form-control form-control-sm accommodation-input';
  totalInput.name = 'overnightAllowanceAmount';
  totalInput.readOnly = true;
  totalInput.placeholder = '0.00';
  totalInput.setAttribute('aria-label', 'Overnight allowance total');

  amountCell.appendChild(nightsLabel);
  amountCell.appendChild(nightsInput);
  amountCell.appendChild(equalsSpan);
  amountCell.appendChild(totalInput);

  // Auto-calculate total
  nightsInput.addEventListener('input', () => {
    const nights = parseFloat(nightsInput.value) || 0;
    totalInput.value = (nights * type.ratePerNight).toFixed(2);
  });

  // Notes cell (empty for allowance)
  const notesCell = document.createElement('td');
  notesCell.textContent = '';

  // Attachment cell (empty for allowance)
  const attachCell = document.createElement('td');
  attachCell.textContent = '';

  row.appendChild(descCell);
  row.appendChild(amountCell);
  row.appendChild(notesCell);
  row.appendChild(attachCell);
  tableBody.appendChild(row);

  disableScrollOnInput(nightsInput);
}

// ============================================
// Other Expenses
// ============================================

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

// ============================================
// Vehicle Section
// ============================================

/**
 * Updates the vehicle amount based on kilometres and vehicle type.
 * @param {number} kilometres - Number of kilometres
 * @param {string} [vehicleType] - Vehicle type key
 * @returns {void}
 */
export function updateVehicleAmount(kilometres, vehicleType) {
  const vehicleAmountInput = document.getElementById('vehicleAmount');
  if (vehicleAmountInput) {
    const type = vehicleType || getSelectedVehicleType();
    const amount = calculateVehicleAmount(kilometres, type);
    vehicleAmountInput.value = amount.toFixed(2);
  }
}

/**
 * Gets the currently selected vehicle type from the dropdown.
 * @returns {string} Vehicle type key
 */
export function getSelectedVehicleType() {
  const select = document.getElementById('vehicleType');
  return select ? select.value : DEFAULT_VEHICLE_TYPE;
}

/**
 * Sets up vehicle type dropdown change handler.
 * Updates rate display and recalculates amount when vehicle type changes.
 * @returns {void}
 */
export function setupVehicleTypeDropdown() {
  const vehicleTypeSelect = document.getElementById('vehicleType');
  const rateInput = document.getElementById('rate');
  const kmsInput = document.getElementById('kms');

  if (vehicleTypeSelect) {
    vehicleTypeSelect.addEventListener('change', () => {
      const type = vehicleTypeSelect.value;
      const rate = getVehicleRate(type);

      // Update rate display
      if (rateInput) {
        rateInput.value = rate.toFixed(2);
      }

      // Recalculate amount
      const kms = parseFloat(kmsInput?.value) || 0;
      updateVehicleAmount(kms, type);
    });
  }
}

// ============================================
// Travel Dates & Days Calculation
// ============================================

/**
 * Calculates the number of days between two datetime-local values.
 * @param {string} startValue - Start datetime-local value
 * @param {string} endValue - End datetime-local value
 * @returns {number|null} Number of days (rounded to nearest 0.5) or null if invalid
 */
export function calculateTravelDays(startValue, endValue) {
  if (!startValue || !endValue) return null;
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  // Always round up to nearest whole number
  return Math.ceil(diffDays);
}

/**
 * Sets up auto-calculation of travel days from start/end dates.
 * Supports manual override — once the user edits the field, auto-calc stops
 * until they clear it or the dates change again.
 * @returns {void}
 */
export function setupTravelDatesCalculation() {
  const startInput = document.getElementById('travelStartDate');
  const endInput = document.getElementById('travelEndDate');
  const daysInput = document.getElementById('numberOfDays');
  const autoCalcNote = document.getElementById('daysAutoCalcNote');

  if (!startInput || !endInput || !daysInput) return;

  // Track manual override
  let manuallyOverridden = false;

  // When user manually edits the days field
  daysInput.addEventListener('input', () => {
    manuallyOverridden = true;
    if (autoCalcNote) {
      autoCalcNote.textContent = 'Manually entered. Clear to resume auto-calculation.';
    }
  });

  // Reset override if field is cleared
  daysInput.addEventListener('change', () => {
    if (!daysInput.value || daysInput.value === '') {
      manuallyOverridden = false;
      if (autoCalcNote) {
        autoCalcNote.textContent = 'Auto-calculated from travel dates. Edit to override.';
      }
      // Recalculate
      const days = calculateTravelDays(startInput.value, endInput.value);
      if (days !== null) {
        daysInput.value = days;
      }
    }
  });

  // Auto-calculate when dates change
  const onDateChange = () => {
    if (manuallyOverridden) return;
    const days = calculateTravelDays(startInput.value, endInput.value);
    if (days !== null) {
      daysInput.value = days;
    }
  };

  startInput.addEventListener('change', onDateChange);
  endInput.addEventListener('change', onDateChange);
}

// ============================================
// Mileage Daily Limit Check (Members Only)
// ============================================

/** @type {number} Maximum mileage reimbursement per day for members */
const MILEAGE_DAILY_LIMIT = 165;

/**
 * Checks the mileage amount against the daily limit based on number of travel days.
 * Only applies to "member" claimant type. Shows a warning if the amount exceeds the limit.
 * @returns {void}
 */
export function checkMileageDailyLimit() {
  const warningEl = document.getElementById('mileageLimitWarning');
  if (!warningEl) return;

  // Only check for members
  const claimantType = document.querySelector('input[name="claimantType"]:checked');
  if (!claimantType || claimantType.value !== 'member') {
    warningEl.classList.add('d-none');
    return;
  }

  const vehicleAmount = parseFloat(document.getElementById('vehicleAmount')?.value) || 0;
  const numberOfDays = parseFloat(document.getElementById('numberOfDays')?.value) || 0;

  if (vehicleAmount <= 0 || numberOfDays <= 0) {
    warningEl.classList.add('d-none');
    return;
  }

  const maxAllowed = numberOfDays * MILEAGE_DAILY_LIMIT;

  if (vehicleAmount > maxAllowed) {
    warningEl.textContent = `Warning: Mileage claim of $${vehicleAmount.toFixed(2)} exceeds the daily limit of $${MILEAGE_DAILY_LIMIT}/day × ${numberOfDays} day(s) = $${maxAllowed.toFixed(2)}. The claim will be capped at $${maxAllowed.toFixed(2)} for review.`;
    warningEl.classList.remove('d-none');
  } else {
    warningEl.classList.add('d-none');
  }
}

/**
 * Sets up mileage daily limit checking listeners.
 * @returns {void}
 */
export function setupMileageLimitCheck() {
  const kmsInput = document.getElementById('kms');
  const vehicleTypeSelect = document.getElementById('vehicleType');
  const daysInput = document.getElementById('numberOfDays');

  const inputs = [kmsInput, vehicleTypeSelect, daysInput].filter(Boolean);
  inputs.forEach(input => {
    input.addEventListener('input', checkMileageDailyLimit);
    input.addEventListener('change', checkMileageDailyLimit);
  });

  // Also re-check when claimant type changes
  document.querySelectorAll('input[name="claimantType"]').forEach(radio => {
    radio.addEventListener('change', checkMileageDailyLimit);
  });
}

// ============================================
// Not Travel-Related Toggle
// ============================================

/**
 * Sets up the "not travel-related" checkbox to show/hide travel details.
 * When checked, hides travel date fields and removes their required attributes.
 * @returns {void}
 */
export function setupNotTravelRelatedToggle() {
  const checkbox = document.getElementById('notTravelRelated');
  const travelSection = document.getElementById('travelDetailsSection');
  const startInput = document.getElementById('travelStartDate');
  const endInput = document.getElementById('travelEndDate');

  if (!checkbox || !travelSection) return;

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      travelSection.classList.add('d-none');
      if (startInput) {
        startInput.removeAttribute('required');
        startInput.removeAttribute('aria-required');
        startInput.value = '';
      }
      if (endInput) {
        endInput.removeAttribute('required');
        endInput.removeAttribute('aria-required');
        endInput.value = '';
      }
      const daysInput = document.getElementById('numberOfDays');
      if (daysInput) daysInput.value = '';
    } else {
      travelSection.classList.remove('d-none');
      if (startInput) {
        startInput.setAttribute('required', '');
        startInput.setAttribute('aria-required', 'true');
      }
      if (endInput) {
        endInput.setAttribute('required', '');
        endInput.setAttribute('aria-required', 'true');
      }
    }
  });
}

/**
 * Returns whether the "not travel-related" checkbox is checked.
 * @returns {boolean}
 */
export function isNotTravelRelated() {
  const checkbox = document.getElementById('notTravelRelated');
  return checkbox ? checkbox.checked : false;
}

// ============================================
// Alerts & Feedback
// ============================================

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
 * @param {string} [claimantType='member'] - Initial claimant type
 * @returns {void}
 */
export function initializeUI(config, claimantType = 'member') {
  disablePrintMode();
  setDefaultDate();
  renderAttachmentFilenames();
  generateExpenseTable(EXPENSE_TYPES, claimantType);
  setupVehicleTypeDropdown();
  setupTravelDatesCalculation();
  disableScrollOnNumberInputs();
  if (config && config.DEBUG_MODE && config.DEBUG_MODE.toUpperCase() === 'DEBUG') {
    hidePdfButton();
  }
}

// ============================================
// Bank Account Number Auto-Formatting
// ============================================

/**
 * Formats a bank account number string with hyphens in NZ format: BB-bbbb-AAAAAAA-SSS.
 * Only allows numeric input. Auto-inserts hyphens at positions 2, 6, and 13.
 * @param {string} raw - Raw input value
 * @returns {string} Formatted bank account number
 */
export function formatBankAccountNumber(raw) {
  // Strip all non-digit characters
  const digits = raw.replace(/\D/g, '');

  // Limit to 16 digits max (2+4+7+3)
  const limited = digits.slice(0, 16);

  // Build formatted string with hyphens
  let formatted = '';
  for (let i = 0; i < limited.length; i++) {
    if (i === 2 || i === 6 || i === 13) {
      formatted += '-';
    }
    formatted += limited[i];
  }

  return formatted;
}

/**
 * Sets up bank account number auto-formatting with hyphens.
 * Restricts input to numeric characters and auto-inserts hyphens.
 * @returns {void}
 */
export function setupBankAccountFormatting() {
  const input = document.getElementById('bankAccountNumber');
  if (!input) return;

  input.addEventListener('input', () => {
    const cursorPos = input.selectionStart;
    const oldValue = input.value;
    const formatted = formatBankAccountNumber(oldValue);
    input.value = formatted;

    // Try to maintain cursor position intelligently
    const diff = formatted.length - oldValue.length;
    const newPos = Math.max(0, cursorPos + diff);
    input.setSelectionRange(newPos, newPos);
  });

  // Prevent non-numeric key presses (except navigation keys)
  input.addEventListener('keypress', (e) => {
    // Allow control keys
    if (e.ctrlKey || e.metaKey) return;
    // Only allow digits
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  });
}

// ============================================
// Button Loading States
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
// Progress Overlay
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
