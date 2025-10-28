/**
 * Form Handler Module
 * Purpose: Handle form submission and data collection
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { collectAttachments, logError, safeParseFloat } from './utils.js';
import { EXPENSE_TYPES, getAccountCode, VEHICLE_ACCOUNT_CODE } from './expense-types.js';
import { showAlert, setFormToViewMode } from './ui-handlers.js';
import { generatePDFBase64, mergeAttachmentsPDF, getDynamicPdfFilename, getAttachmentsPdfFilename } from './pdf-generator.js';
import { shouldSubmitIndividually } from './config-loader.js';

/**
 * Collects standard expense items from the form.
 * @returns {Promise<Array<object>>} Array of expense items
 */
async function collectStandardExpenses() {
  const standardExpenses = [];
  const standardRows = document.querySelectorAll('#StandardExpensesTable tbody tr');
  
  for (const row of standardRows) {
    const type = row.cells[0].textContent.trim();
    const amountInput = row.querySelector('input[type=\"number\"]');
    const fileInput = row.querySelector('input[type=\"file\"]');
    
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
    const description = row.querySelector('input[name=\"other_description[]\"]')?.value || '';
    const amountInput = row.querySelector('input[name=\"other_amount[]\"]');
    const amount = amountInput ? safeParseFloat(amountInput.value, 0) : 0;
    
    const attachmentInput = row.querySelector('input[name=\"other_attachment[]\"]');
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
 * Builds a JSON array of all line items for submission.
 * @param {Array<object>} expenseItems - All expense items
 * @param {object} vehicleData - Vehicle expense data
 * @returns {string} JSON string of line items
 */
function buildLineItemsJSON(expenseItems, vehicleData) {
  const lineItems = [];
  
  // Add standard and other expenses
  expenseItems.forEach(item => {
    if (item.amount > 0) {
      const description = item.type === 'Other' 
        ? `Other Expenses - `{item.description}`
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
      ? `Private Vehicle - `{vehicleData.comment}`
      : 'Private Vehicle';
    
    lineItems.push({
      description,
      quantity: 1,
      amount: vehicleData.amount,
      accountCode: VEHICLE_ACCOUNT_CODE,
      taxType: ''
    });
  }
  
  return JSON.stringify(lineItems, null, 2);
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
      headers: { 'Content-Type': 'application/json' },
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
 * @returns {Promise<boolean>} True if submission successful
 */
async function submitBulk(expenseItems, vehicleData, formData, apiUrl) {
  try {
    // Build line items JSON
    const lineItemsJSON = buildLineItemsJSON(expenseItems, vehicleData);
    
    // Generate summary PDF
    let pdfBase64;
    try {
      pdfBase64 = await generatePDFBase64();
    } catch (err) {
      logError('PDF generation failed before form submit', err);
      showAlert('Failed to generate PDF. Submission aborted.', 'danger');
      return false;
    }
    
    // Build payload
    const payload = {
      ...formData,
      varFlowEnvUpload: false,
      lineItems: lineItemsJSON,
      summaryPdfAttachment: {
        filename: getDynamicPdfFilename(),
        content: pdfBase64
      }
    };
    
    // Merge attachments into PDF
    try {
      const mergedPdfBase64 = await mergeAttachmentsPDF();
      if (mergedPdfBase64) {
        payload.attachmentsPdf = {
          filename: getAttachmentsPdfFilename(),
          content: mergedPdfBase64
        };
      }
    } catch (err) {
      logError('Attachment merge failed', err);
      // Continue without merged attachments
    }
    
    // Submit to API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    logError('Bulk submission failed', error);
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
  
  try {
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
        showAlert('Successfully submitted all expense line items.', 'success');
      }
    } else {
      success = await submitBulk(expenseItems, vehicleData, formData, apiUrl);
      if (success) {
        showAlert('Successfully submitted the expense form.', 'success');
      } else {
        showAlert('Failed to submit the expense form.', 'danger');
      }
    }
    
    // Set form to view mode if successful
    if (success) {
      setFormToViewMode(form);
    }
  } catch (error) {
    logError('Form submission error', error);
    showAlert('An unexpected error occurred during submission.', 'danger');
  }
}
