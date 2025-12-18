/**
 * Form Handler Module
 * Purpose: Handle form submission and data collection
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { collectAttachments, logError, safeParseFloat, calculatePayloadSize, exceedsPayloadLimit, formatBytes, DEFAULT_PAYLOAD_LIMIT_MB } from './utils.js';
import { EXPENSE_TYPES, getAccountCode, VEHICLE_ACCOUNT_CODE } from './expense-types.js';
import { showAlert, setFormToViewMode, setButtonLoadingWithText, showProgressOverlay, updateProgressStatus, hideProgressOverlay } from './ui-handlers.js';
import { generatePDFBase64, mergeAttachmentsPDF, mergeAttachmentsByAccountCode, getDynamicPdfFilename, getAttachmentsPdfFilename, processFileAsIndividualAttachment, collectAttachmentsWithAccountCodes } from './pdf-generator.js';
import { shouldSubmitIndividually, shouldStringifyLineItems, getEffectiveApiUrl } from './config-loader.js';
import { showSuccess, showError, showWarning } from './toast.js';

/**
 * Error types for categorizing submission failures
 */
const ERROR_TYPES = {
  OFFLINE: 'offline',
  NETWORK: 'network',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

/**
 * Categorizes an error for user-friendly messaging
 * @param {Error} error - The error to categorize
 * @returns {string} Error type from ERROR_TYPES
 */
function categorizeError(error) {
  if (!navigator.onLine) {
    return ERROR_TYPES.OFFLINE;
  }
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    return ERROR_TYPES.NETWORK;
  }
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Gets user-friendly error message based on error type
 * @param {string} errorType - Error type from ERROR_TYPES
 * @returns {string} User-friendly error message
 */
function getErrorMessage(errorType) {
  switch (errorType) {
    case ERROR_TYPES.OFFLINE:
      return 'You appear to be offline. Please check your internet connection and try again.';
    case ERROR_TYPES.NETWORK:
      return 'Unable to reach the server. Please check your connection and try again in a few moments.';
    case ERROR_TYPES.TIMEOUT:
      return 'The request timed out. The server may be busy - please try again in a few minutes.';
    case ERROR_TYPES.SERVER:
      return 'The server encountered an error. Please try again later or contact support if the problem persists.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
}

/**
 * Collects standard expense items from the form.
 * @returns {Promise<Array<object>>} Array of expense items
 */
async function collectStandardExpenses() {
  const standardExpenses = [];
  const standardRows = document.querySelectorAll('#StandardExpensesTable tbody tr');

  for (const row of standardRows) {
    // Get the expense name from the .expense-name span, not the full cell text
    // The cell contains both name and account code: "<span class='expense-name'>Flights</span><span class='expense-code'> (480)</span>"
    const nameSpan = row.cells[0].querySelector('.expense-name');
    const type = nameSpan ? nameSpan.textContent.trim() : row.cells[0].textContent.trim();
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
 * Submits a single batch to the API.
 * @param {object} payload - The payload to submit
 * @param {string} apiUrl - API endpoint URL
 * @param {boolean} stringifyForZapier - Whether to Base64-encode the payload
 * @returns {Promise<{success: boolean, errorType?: string}>}
 */
async function submitSingleBatch(payload, apiUrl, stringifyForZapier) {
  try {
    // Base64 encode attachments if configured for Zapier
    const finalPayload = {
      ...payload,
      attachments: stringifyForZapier
        ? btoa(JSON.stringify(payload.attachments))
        : payload.attachments,
      lineItems: payload.lineItems
        ? (stringifyForZapier ? btoa(JSON.stringify(payload.lineItems)) : payload.lineItems)
        : undefined
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(finalPayload)
    });

    if (!response.ok) {
      return { success: false, errorType: ERROR_TYPES.SERVER };
    }
    return { success: true };
  } catch (error) {
    logError('Batch submission failed', error);
    return { success: false, errorType: categorizeError(error), error };
  }
}

/**
 * Submits all expense data as a bulk submission.
 * Automatically splits into batches if payload exceeds Xero API limits.
 * @param {Array<object>} expenseItems - All expense items
 * @param {object} vehicleData - Vehicle expense data
 * @param {object} formData - Basic form data
 * @param {string} apiUrl - API endpoint URL
 * @param {object} config - Application configuration
 * @returns {Promise<{success: boolean, errorType?: string}>}
 */
async function submitBulk(expenseItems, vehicleData, formData, apiUrl, config) {
  try {
    // Build line items array
    const lineItemsArray = buildLineItemsArray(expenseItems, vehicleData);
    const stringifyLineItems = shouldStringifyLineItems(config);

    // Show progress overlay for PDF generation
    showProgressOverlay('Generating PDF', 'Creating expense claim summary...');

    // Generate summary PDF
    let summaryPdfBase64;
    try {
      summaryPdfBase64 = await generatePDFBase64();
    } catch (err) {
      logError('PDF generation failed before form submit', err);
      hideProgressOverlay();
      showError('Failed to generate PDF. Submission aborted.');
      return { success: false, errorType: ERROR_TYPES.UNKNOWN };
    }

    // Create summary attachment object
    const summaryAttachment = {
      fileName: getDynamicPdfFilename(),
      mimeType: 'application/pdf',
      content: summaryPdfBase64
    };

    // Process attachments by account code
    updateProgressStatus('Processing attachments by category...');
    let attachmentGroups = [];
    try {
      attachmentGroups = await mergeAttachmentsByAccountCode();
    } catch (err) {
      logError('Attachment grouping failed', err);
      showWarning('Failed to process attachments. Submitting without receipt images.', { duration: 8000 });
    }

    // Calculate total payload size (summary + all attachment groups)
    const allAttachments = [summaryAttachment];
    for (const group of attachmentGroups) {
      allAttachments.push({
        fileName: group.filename,
        mimeType: 'application/pdf',
        content: group.pdf
      });
    }

    const totalPayloadSize = calculatePayloadSize(allAttachments, stringifyLineItems);
    const payloadExceedsLimit = exceedsPayloadLimit(totalPayloadSize);

    console.log(`[ExpenseClaim] Total payload size: ${formatBytes(totalPayloadSize)}, Limit: ${DEFAULT_PAYLOAD_LIMIT_MB}MB, Exceeds: ${payloadExceedsLimit}`);

    // If payload fits within limit, use single request (existing behavior)
    if (!payloadExceedsLimit) {
      updateProgressStatus('Submitting to server...');

      // Build single payload with all attachments
      const lineItemsPayload = stringifyLineItems
        ? btoa(JSON.stringify(lineItemsArray))
        : lineItemsArray;

      // If we have grouped attachments, use merged PDF approach
      let attachmentsArray;
      if (attachmentGroups.length > 0) {
        // Merge all groups into single PDF for backwards compatibility
        const mergedPdfBase64 = await mergeAttachmentsPDF();
        attachmentsArray = [summaryAttachment];
        if (mergedPdfBase64) {
          attachmentsArray.push({
            fileName: getAttachmentsPdfFilename(),
            mimeType: 'application/pdf',
            content: mergedPdfBase64
          });
        }
      } else {
        attachmentsArray = [summaryAttachment];
      }

      const attachmentsPayload = stringifyLineItems
        ? btoa(JSON.stringify(attachmentsArray))
        : attachmentsArray;

      const payload = {
        ...formData,
        varFlowEnvUpload: false,
        lineItems: lineItemsPayload,
        attachments: attachmentsPayload
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      hideProgressOverlay();

      if (!response.ok) {
        return { success: false, errorType: ERROR_TYPES.SERVER };
      }
      return { success: true };
    }

    // Payload exceeds limit - use batched submission
    console.log(`[ExpenseClaim] Payload too large (${formatBytes(totalPayloadSize)}), splitting into batches by account code`);
    showWarning(`Large payload detected (${formatBytes(totalPayloadSize)}). Submitting in batches...`, { duration: 5000 });

    const totalBatches = 1 + attachmentGroups.length; // Main + attachment groups
    let successCount = 0;
    let failedGroups = [];

    // Batch 1: Main submission with summary PDF and line items
    updateProgressStatus(`Submitting batch 1 of ${totalBatches} (Summary)...`);

    const mainPayload = {
      ...formData,
      varFlowEnvUpload: false,
      lineItems: lineItemsArray,
      attachments: [summaryAttachment],
      batchInfo: {
        batch: 1,
        totalBatches,
        type: 'main'
      }
    };

    const mainResult = await submitSingleBatch(mainPayload, apiUrl, stringifyLineItems);
    if (mainResult.success) {
      successCount++;
    } else {
      hideProgressOverlay();
      return { success: false, errorType: mainResult.errorType || ERROR_TYPES.SERVER };
    }

    // Batches 2-N: Attachment groups by account code
    for (let i = 0; i < attachmentGroups.length; i++) {
      const group = attachmentGroups[i];
      const batchNum = i + 2;

      updateProgressStatus(`Submitting batch ${batchNum} of ${totalBatches} (${group.displayName})...`);

      // Check if this single group exceeds the limit
      const groupSize = calculatePayloadSize([{
        fileName: group.filename,
        mimeType: 'application/pdf',
        content: group.pdf
      }], stringifyLineItems);

      if (exceedsPayloadLimit(groupSize)) {
        // Group is too large - fall back to individual file submission with progressive compression
        console.log(`[ExpenseClaim] Group ${group.displayName} (${formatBytes(groupSize)}) exceeds limit, falling back to individual files`);
        updateProgressStatus(`Processing ${group.displayName} files individually...`);

        // Get the original files for this account code
        const attachmentsByCode = collectAttachmentsWithAccountCodes();
        const groupFiles = attachmentsByCode.get(group.accountCode) || [];

        let individualSuccessCount = 0;
        let individualFailCount = 0;

        for (let j = 0; j < groupFiles.length; j++) {
          const { file, expenseType } = groupFiles[j];
          updateProgressStatus(`Processing ${group.displayName} file ${j + 1} of ${groupFiles.length}...`);

          // Try to process the file with progressive compression
          const limitBytes = DEFAULT_PAYLOAD_LIMIT_MB * 1024 * 1024;
          const individualAttachment = await processFileAsIndividualAttachment(file, expenseType, limitBytes * 0.8);

          if (!individualAttachment) {
            console.warn(`[ExpenseClaim] File ${file.name} could not be compressed to fit limit`);
            individualFailCount++;
            continue;
          }

          // Submit the individual file
          const individualPayload = {
            ...formData,
            varFlowEnvUpload: false,
            attachments: [{
              fileName: individualAttachment.fileName,
              mimeType: individualAttachment.mimeType,
              content: individualAttachment.content
            }],
            batchInfo: {
              batch: batchNum,
              totalBatches,
              type: 'individual-attachment',
              accountCode: group.accountCode,
              displayName: group.displayName,
              originalFile: file.name
            }
          };

          const individualResult = await submitSingleBatch(individualPayload, apiUrl, stringifyLineItems);
          if (individualResult.success) {
            individualSuccessCount++;
          } else {
            individualFailCount++;
            logError(`Failed to submit individual file ${file.name}`, individualResult.error);
          }
        }

        // Track results
        if (individualSuccessCount > 0) {
          successCount++;
        }
        if (individualFailCount > 0) {
          failedGroups.push(`${group.displayName} (${individualFailCount}/${groupFiles.length} files failed)`);
        }
        continue;
      }

      const attachmentPayload = {
        ...formData,
        varFlowEnvUpload: false,
        attachments: [{
          fileName: group.filename,
          mimeType: 'application/pdf',
          content: group.pdf
        }],
        batchInfo: {
          batch: batchNum,
          totalBatches,
          type: 'attachments',
          accountCode: group.accountCode,
          displayName: group.displayName
        }
      };

      const batchResult = await submitSingleBatch(attachmentPayload, apiUrl, stringifyLineItems);
      if (batchResult.success) {
        successCount++;
      } else {
        failedGroups.push(group.displayName);
        logError(`Failed to submit attachment batch for ${group.displayName}`, batchResult.error);
      }
    }

    hideProgressOverlay();

    // Report results
    if (failedGroups.length > 0) {
      showWarning(`Some attachment batches failed: ${failedGroups.join(', ')}. ${successCount}/${totalBatches} batches submitted.`, { duration: 10000 });
    }

    // Consider success if main batch succeeded
    return { success: successCount > 0 };
  } catch (error) {
    logError('Bulk submission failed', error);
    hideProgressOverlay();
    return { success: false, errorType: categorizeError(error), error };
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
  const apiUrl = getEffectiveApiUrl(config);
  const submitButton = form.querySelector('button[type="submit"]');

  // Check for offline status before attempting submission
  if (!navigator.onLine) {
    showError(getErrorMessage(ERROR_TYPES.OFFLINE));
    return;
  }

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
      const result = await submitBulk(expenseItems, vehicleData, formData, apiUrl, config);
      if (result.success) {
        showSuccess('Successfully submitted the expense form.');
        success = true;
      } else {
        showError(getErrorMessage(result.errorType));
        success = false;
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
    const errorType = categorizeError(error);
    showError(getErrorMessage(errorType));
    setButtonLoadingWithText(submitButton, false);
  }
}

// Export pure functions for testing
export { buildLineItemsArray, collectVehicleData, collectFormData, submitBulk, submitIndividualItems };
