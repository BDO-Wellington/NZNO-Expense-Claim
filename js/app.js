/**
 * Main Application Entry Point
 * Purpose: Initialize and wire up all modules
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { loadConfig, showConfigError } from './modules/config-loader.js';
import { initializeUI, setupEventListeners } from './modules/ui-handlers.js';
import { handleFormSubmit } from './modules/form-handler.js';
import { downloadPDF, validatePdfLibraries } from './modules/pdf-generator.js';
import { logError } from './modules/utils.js';
import { setupFormValidation } from './modules/validation.js';

/**
 * Application state
 */
let appConfig = null;

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
    }
    
    // Initialize UI
    console.log('[ExpenseClaim] Initializing UI...');
    initializeUI(appConfig);

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
