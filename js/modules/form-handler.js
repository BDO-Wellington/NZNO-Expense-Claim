/**
 * Form Handler Module
 * Purpose: Handle form submission and data collection
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { collectAttachments, logError, safeParseFloat } from './utils.js';
import { EXPENSE_TYPES, getAccountCode, VEHICLE_ACCOUNT_CODE } from './expense-types.js';
import { showAlert, setFormToViewMode, setButtonLoadingWithText, showProgressOverlay, updateProgressStatus, hideProgressOverlay } from './ui-handlers.js';
import { generatePDFBase64, mergeAttachmentsPDF, getDynamicPdfFilename, getAttachmentsPdfFilename } from './pdf-generator.js';
import { shouldSubmitIndividually, shouldStringifyLineItems } from './config-loader.js';
import { showSuccess, showError, showWarning } from './toast.js';

/**
 * Collects standard expense items from the form.
 * @returns {Promise<Array<object>>} Array of expense items
 */
async function collectStandardExpenses() {
  const standardExpenses = [];
  const standardRows = document.querySelectorAll('#StandardExpensesTable tbody tr');
  
  for (const row of standardRows) {
    const type = row.cells[0].textContent.trim();
    const amountInput = row.querySelector('input[type="number"]');
    const fileInput = row.querySelector('input[type="file"]');
    
    const amount = amountInput ? safeParseFloat(amountInput.value, 0) : 0;
    const attachments = await collectAttachments(fileInput);
    
    standardExpenses.push({
      type,
      amount,
      description: '',
      attachments,
      accountCode: getAccountCode(type)
    });
  }
  
  return standardExpenses;
}

/**
 * Collects other expense items from the form.
 * @returns {Promise<Array<object>>} Array of expense items
 */
async function collectOtherExpenses() {
  const otherExpenses = [];
  const otherRows = document.querySelectorAll('#otherExpensesBody tr');
  
  for (const row of otherRows) {
    const description = row.querySelector('input[name="other_description[]"]')?.value || '';
    const amountInput = row.querySelector('input[name="other_amount[]"]');
    const amount = amountInput ? safeParseFloat(amountInput.value, 0) : 0;
    
    const attachmentInput = row.querySelector('input[name="other_attachment[]"]');
    const attachments = await collectAttachments(attachmentInput);
    
    otherExpenses.push({
      type: 'Other',
      amount,
      description,
      attachments,
      accountCode: ''
    });
  }
  
  return otherExpenses;
}

/**
 * Collects vehicle expense data from the form.
 * @param {HTMLFormElement} form - The form element
 * @returns {object} Vehicle expense data
 */
function collectVehicleData(form) {
  return {
    kms: safeParseFloat(form.kms?.value, 0),
    rate: safeParseFloat(form.rate?.value, 0),
    amount: safeParseFloat(form.vehicleAmount?.value, 0),
    comment: form.vehicleComment?.value || ''
  };
}

/**
 * Builds an array of all line items for submission.
 * @param {Array<object>} expenseItems - All expense items
 * @param {object} vehicleData - Vehicle expense data
 * @returns {Array<object>} Array of line items
 */
function buildLineItemsArray(expenseItems, vehicleData) {
  const lineItems = [];

  // Add standard and other expenses
  expenseItems.forEach(item => {
    if (item.amount > 0) {
      const description = item.type === 'Other'
        ? `Other Expenses - ${item.description}`
        : item.type;

      lineItems.push({
        description,
        quantity: 1,
        amount: item.amount,
        accountCode: item.accountCode || '',
        taxType: ''
      });
    }
  });

  // Add private vehicle if applicable
  if (vehicleData.kms > 0 && vehicleData.amount > 0) {
    const description = vehicleData.comment
      ? `Private Vehicle - ${vehicleData.comment}`
      : 'Private Vehicle';

    lineItems.push({
      description,
      quantity: 1,
      amount: vehicleData.amount,
      accountCode: VEHICLE_ACCOUNT_CODE,
      taxType: ''
    });
  }

  return lineItems;
}

/**
 * Collects all form data for submission.
 * @param {HTMLFormElement} form - The form element
 * @returns {object} Form data object
 */
function collectFormData(form) {
  return {
    fullName: form.fullName?.value || '',
    employeeId: form.employeeId?.value || '',
    expenseDate: form.expenseDate?.value || ''
  };
}

/**
 * Submits a single expense item to the API.
 * @param {object} item - Expense item to submit
 * @param {object} formData - Basic form data
 * @param {string} apiUrl - API endpoint URL
 * @returns {Promise<boolean>} True if successful
 */
async function submitSingleItem(item, formData, apiUrl) {
  try {
    const payload = {
      ...formData,
      varFlowEnvUpload: true,
      expenseItems: [item]
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    logError('Failed to submit expense item', error);
    return false;
  }
}

/**
 * Submits expense items individually.
 * @param {Array<object>} expenseItems - All expense items
 * @param {object} formData - Basic form data
 * @param {string} apiUrl - API endpoint URL
 * @returns {Promise<boolean>} True if all items submitted successfully
 */
async function submitIndividualItems(expenseItems, formData, apiUrl) {
  // Only submit items with amounts > 0
  const itemsToSubmit = expenseItems.filter(item => item.amount > 0);
  
  if (itemsToSubmit.length === 0) {
    showAlert('No expense items to submit.', 'warning');
    return false;
  }
  
  for (const item of itemsToSubmit) {
    const success = await submitSingleItem(item, formData, apiUrl);
    if (!success) {
      showAlert('Failed to submit one or more expense line items.', 'danger');
      return false;
    }
  }
  
  return true;
}

/**
 * Submits all expense data as a bulk submission.
 * @param {Array<object>} expenseItems - All expense items
 * @param {object} vehicleData - Vehicle expense data
 * @param {object} formData - Basic form data
 * @param {string} apiUrl - API endpoint URL
 * @param {object} config - Application configuration
 * @returns {Promise<boolean>} True if submission successful
 */
async function submitBulk(expenseItems, vehicleData, formData, apiUrl, config) {
  try {
    // Build line items array
    const lineItemsArray = buildLineItemsArray(expenseItems, vehicleData);

    // Show progress overlay for PDF generation
    showProgressOverlay('Generating PDF', 'Creating expense claim summary...');

    // Generate summary PDF
    let pdfBase64;
    try {
      pdfBase64 = await generatePDFBase64();
    } catch (err) {
      logError('PDF generation failed before form submit', err);
      hideProgressOverlay();
      showError('Failed to generate PDF. Submission aborted.');
      return false;
    }

    // Determine how to send line items based on config
    // - As Base64-encoded JSON string: for Zapier Code actions (prevents auto-parsing and flattening)
    // - As array: for Zapier child key iteration or other integrations
    const stringifyLineItems = shouldStringifyLineItems(config);
    const lineItemsPayload = stringifyLineItems
      ? btoa(JSON.stringify(lineItemsArray)) // Base64 encode to prevent Zapier from detecting and parsing JSON
      : lineItemsArray;

    // Build attachments array
    const attachmentsArray = [{
      fileName: getDynamicPdfFilename(),
      mimeType: 'application/pdf',
      content: pdfBase64
    }];

    // Merge attachments into PDF and add to array
    updateProgressStatus('Merging attachments...');
    try {
      const mergedPdfBase64 = await mergeAttachmentsPDF();
      if (mergedPdfBase64) {
        attachmentsArray.push({
          fileName: getAttachmentsPdfFilename(),
          mimeType: 'application/pdf',
          content: mergedPdfBase64
        });
      } else {
        // Warn user that attachments could not be processed
        showWarning('Attachments could not be merged into PDF. Your claim will be submitted without receipt images.', { duration: 8000 });
      }
    } catch (err) {
      logError('Attachment merge failed', err);
      // Warn user about the failure and continue with just the summary PDF
      showWarning('Failed to process attachments. Your claim will be submitted without receipt images.', { duration: 8000 });
    }

    // Base64 encode attachments array (same pattern as lineItems) to prevent Zapier flattening
    const attachmentsPayload = stringifyLineItems
      ? btoa(JSON.stringify(attachmentsArray))
      : attachmentsArray;

    // Build payload
    const payload = {
      ...formData,
      varFlowEnvUpload: false,
      lineItems: lineItemsPayload,
      attachments: attachmentsPayload
    };

    // Update progress and submit to API
    updateProgressStatus('Submitting to server...');

    // Submit to API (use text/plain to avoid CORS preflight with Zapier)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    hideProgressOverlay();
    return response.ok;
  } catch (error) {
    logError('Bulk submission failed', error);
    hideProgressOverlay();
    return false;
  }
}

/**
 * Main form submission handler.
 * @param {Event} event - Form submit event
 * @param {object} config - Application configuration
 * @returns {Promise<void>}
 */
export async function handleFormSubmit(event, config) {
  event.preventDefault();

  const form = event.target;
  const apiUrl = config.API_URL;
  const submitButton = form.querySelector('button[type="submit"]');

  try {
    // Show loading state on submit button
    setButtonLoadingWithText(submitButton, true, 'Submitting...');

    // Collect all data
    const formData = collectFormData(form);
    const standardExpenses = await collectStandardExpenses();
    const otherExpenses = await collectOtherExpenses();
    const vehicleData = collectVehicleData(form);

    const expenseItems = [...standardExpenses, ...otherExpenses];

    // Determine submission mode
    const submitIndividually = shouldSubmitIndividually(config);

    let success = false;

    if (submitIndividually) {
      success = await submitIndividualItems(expenseItems, formData, apiUrl);
      if (success) {
        showSuccess('Successfully submitted all expense line items.');
      }
    } else {
      success = await submitBulk(expenseItems, vehicleData, formData, apiUrl, config);
      if (success) {
        showSuccess('Successfully submitted the expense form.');
      } else {
        showError('Failed to submit the expense form. Please try again.');
      }
    }

    // Set form to view mode if successful
    if (success) {
      setFormToViewMode(form);
    } else {
      // Restore button if submission failed
      setButtonLoadingWithText(submitButton, false);
    }
  } catch (error) {
    logError('Form submission error', error);
    showError('An unexpected error occurred during submission.');
    setButtonLoadingWithText(submitButton, false);
  }
}

// Export pure functions for testing
export { buildLineItemsArray, collectVehicleData, collectFormData, submitBulk, submitIndividualItems };
