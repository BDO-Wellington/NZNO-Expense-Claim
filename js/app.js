/**
 * Main Application Entry Point
 * Purpose: Initialize and wire up all modules
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { loadConfig, showConfigError } from './modules/config-loader.js';
import { initializeUI, setupEventListeners, generateExpenseTable } from './modules/ui-handlers.js';
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
    });

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
