/**
 * Main Application Entry Point
 * Purpose: Initialize and wire up all modules
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { loadConfig, showConfigError } from './modules/config-loader.js';
import { initializeUI, setupEventListeners, generateExpenseTable, setupNotTravelRelatedToggle, setupMileageLimitCheck, setupBankAccountFormatting } from './modules/ui-handlers.js';
import { handleFormSubmit } from './modules/form-handler.js';
import { downloadPDF, validatePdfLibraries } from './modules/pdf-generator.js';
import { logError } from './modules/utils.js';
import { setupFormValidation } from './modules/validation.js';
import { showWarning } from './modules/toast.js';
import { setupClaimantTypeToggle, getClaimantType } from './modules/claimant-type.js';
import { EXPENSE_TYPES } from './modules/expense-types.js';

/**
 * Application state
 */
let appConfig = null;
let pdfLibrariesAvailable = true;

/**
 * Updates mileage section visibility based on claimant type.
 * Hides the $165/day limit references when Staff is selected.
 * @param {string} claimantType - The current claimant type
 * @returns {void}
 */
function updateMileageVisibility(claimantType) {
  const isStaff = claimantType === 'staff';

  // Hide mileage note in mileage section for staff
  const mileageNote = document.getElementById('mileageNote');
  if (mileageNote) {
    if (isStaff) {
      mileageNote.textContent = 'Use of private vehicle must be approved prior to travel.';
    } else {
      mileageNote.textContent = 'Use of private vehicle must be approved by NZNO prior to travel. Mileage claims are limited to the rental equivalent of $165 per day for all vehicle types.';
    }
  }

  // Hide mileage limit note in Important Information for staff
  const limitNotes = document.querySelectorAll('.mileage-limit-note');
  limitNotes.forEach(note => {
    note.style.display = isStaff ? 'none' : '';
  });

  // Hide mileage warning for staff
  const warningEl = document.getElementById('mileageLimitWarning');
  if (warningEl && isStaff) {
    warningEl.classList.add('d-none');
  }

  // Update meals travel note - Members get simplified wording
  const mealsTravelNote = document.getElementById('mealsTravelNote');
  if (mealsTravelNote) {
    if (isStaff) {
      mealsTravelNote.textContent = 'If travelling away for only one day, a claim can be made for breakfast if departure from home base is before 7AM and dinner only if you are unable to return to home base before 7.30PM. Breakfast and dinner may be claimed when away from home base overnight.';
    } else {
      mealsTravelNote.textContent = 'If travelling away for only one day, a claim can be made for breakfast if departure from home base is very early and dinner only if you are unable to return to home base until late. Breakfast and dinner may be claimed when away from home base overnight.';
    }
  }

  // Update mileage approval note - Members need "by NZNO"
  const mileageApprovalNote = document.getElementById('mileageApprovalNote');
  if (mileageApprovalNote) {
    if (isStaff) {
      mileageApprovalNote.textContent = 'Use of private vehicle must be approved prior to travel.';
    } else {
      mileageApprovalNote.textContent = 'Use of private vehicle must be approved by NZNO prior to travel.';
    }
  }
}

/**
 * Initializes the application.
 * @returns {Promise<void>}
 */
async function initApp() {
  try {
    // Load configuration
    console.log('[ExpenseClaim] Loading configuration...');
    appConfig = await loadConfig();
    console.log('[ExpenseClaim] Configuration loaded successfully');

    // Validate PDF libraries are available
    try {
      validatePdfLibraries();
      console.log('[ExpenseClaim] PDF libraries validated');
    } catch (err) {
      console.warn('[ExpenseClaim] PDF library warning:', err.message);
      pdfLibrariesAvailable = false;

      // Show visible warning to user
      showWarning(
        'PDF generation is not available. Please refresh the page or contact support if the problem persists.',
        { duration: 0 } // Don't auto-dismiss
      );

      // Disable submit button since form can't be submitted without PDF
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.title = 'PDF libraries not available - cannot submit';
      }
    }

    // Initialize UI with current claimant type
    console.log('[ExpenseClaim] Initializing UI...');
    const claimantType = getClaimantType();
    initializeUI(appConfig, claimantType);

    // Setup claimant type toggle
    console.log('[ExpenseClaim] Setting up claimant type toggle...');
    setupClaimantTypeToggle((newType) => {
      // Regenerate expense table when claimant type changes
      generateExpenseTable(EXPENSE_TYPES, newType);

      // Toggle mileage limit references based on claimant type
      updateMileageVisibility(newType);
    });

    // Apply initial mileage visibility
    updateMileageVisibility(claimantType);

    // Setup not-travel-related toggle
    setupNotTravelRelatedToggle();

    // Setup mileage daily limit check (members only)
    setupMileageLimitCheck();

    // Setup bank account number auto-formatting
    setupBankAccountFormatting();

    // Setup form validation
    console.log('[ExpenseClaim] Setting up form validation...');
    const form = document.getElementById('expenseForm');
    if (form) {
      setupFormValidation(form);
    }

    // Setup event listeners
    console.log('[ExpenseClaim] Setting up event listeners...');
    setupEventListeners({
      onSubmit: (event) => handleFormSubmit(event, appConfig),
      onPdfDownload: () => downloadPDF()
    });

    console.log('[ExpenseClaim] Application initialized successfully');
  } catch (error) {
    logError('Application initialization failed', error);
    showConfigError(error);
  }
}

/**
 * Main entry point - runs when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Export for testing/debugging
 */
window.__expenseClaimApp = {
  getConfig: () => appConfig,
  reinit: initApp
};
