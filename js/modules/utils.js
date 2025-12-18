/**
 * Utility Functions Module
 * Purpose: Reusable utility functions for the Expense Claim application
 * Author: James McNeil
 * Date: October 28, 2025
 */

/**
 * Converts a File object to a base64 string (without data URL prefix).
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

/**
 * Collects all attachments from a file input as base64 objects.
 * @param {HTMLInputElement} fileInput - The file input element
 * @returns {Promise<Array<{filename: string, content: string}>>} Array of attachment objects
 */
export async function collectAttachments(fileInput) {
  const attachments = [];
  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      try {
        const base64 = await fileToBase64(file);
        attachments.push({ filename: file.name, content: base64 });
      } catch (error) {
        throw new Error(`Failed to process attachment: ${file.name}`);
      }
    }
  }
  return attachments;
}

/**
 * Logs errors to the console with a consistent format.
 * @param {string} message - Error message
 * @param {Error|any} error - Error object or details
 */
export function logError(message, error) {
  if (window.console && window.console.error) {
    console.error(`[ExpenseClaim] ${message}:`, error);
  }
  // Optional: Send to error tracking service
  // Example: sendToErrorTracking(message, error);
}

/**
 * The default timezone for the application (New Zealand).
 * Issue #11: Ensure consistent NZST/NZDT timezone across all environments
 * @constant {string}
 */
export const NZ_TIMEZONE = 'Pacific/Auckland';

/**
 * Formats a date object to YYYY-MM-DD string in NZ timezone.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date) {
  const d = new Date(date);
  // Use Intl.DateTimeFormat with NZ timezone for consistent formatting
  const formatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: NZ_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

/**
 * Sanitizes a string for use as a filename.
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string with only alphanumeric and underscores
 */
export function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Gets today's date in YYYY-MM-DD format using NZ timezone.
 * Issue #11: Uses Pacific/Auckland timezone for consistent dates in Playwright tests
 * @returns {string} Today's date in NZ timezone
 */
export function getTodayDate() {
  return formatDate(new Date());
}

/**
 * Validates an email address format.
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Safely parses a float from user input.
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default value
 */
export function safeParseFloat(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// Payload Size Utilities
// Used for pre-flight validation before submitting to Xero API (3.5MB limit)
// ============================================================================

/**
 * Default payload size limit in MB.
 * Set conservatively below Xero's 3.5MB limit to account for JSON overhead.
 * @constant {number}
 */
export const DEFAULT_PAYLOAD_LIMIT_MB = 2.5;

/**
 * Calculates the decoded byte size of a Base64 string.
 * Base64 encodes 3 bytes into 4 characters, with padding.
 * @param {string} base64String - The Base64 encoded string
 * @returns {number} Size in bytes
 */
export function getBase64SizeInBytes(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return 0;
  }
  // Remove padding characters
  const padding = (base64String.match(/=/g) || []).length;
  // Base64 formula: (length * 3/4) - padding
  return Math.floor((base64String.length * 3) / 4) - padding;
}

/**
 * Calculates the total payload size for an attachments array.
 * Accounts for JSON structure overhead and optional double Base64 encoding.
 * @param {Array<{fileName: string, mimeType: string, content: string}>} attachmentsArray - Attachments to measure
 * @param {boolean} stringifyForZapier - Whether the array will be Base64-encoded again for Zapier
 * @returns {number} Estimated total size in bytes
 */
export function calculatePayloadSize(attachmentsArray, stringifyForZapier = false) {
  if (!attachmentsArray || !Array.isArray(attachmentsArray)) {
    return 0;
  }

  // Calculate size of the attachments array as JSON
  let totalSize = 0;

  for (const attachment of attachmentsArray) {
    // Content size (Base64 string)
    const contentSize = attachment.content ? attachment.content.length : 0;
    // Metadata overhead (fileName, mimeType, JSON structure)
    const metadataOverhead = 100; // Approximate overhead per attachment
    totalSize += contentSize + metadataOverhead;
  }

  // If stringifying for Zapier, the JSON gets Base64-encoded again
  // This adds ~33% overhead
  if (stringifyForZapier) {
    totalSize = Math.ceil(totalSize * 1.34);
  }

  // Add overhead for the rest of the payload (form fields, lineItems, etc.)
  const payloadOverhead = 2000; // ~2KB for other fields
  totalSize += payloadOverhead;

  return totalSize;
}

/**
 * Checks if a payload size exceeds the allowed limit.
 * @param {number} sizeInBytes - The payload size in bytes
 * @param {number} limitMB - The limit in megabytes (default: 2.5MB)
 * @returns {boolean} True if the size exceeds the limit
 */
export function exceedsPayloadLimit(sizeInBytes, limitMB = DEFAULT_PAYLOAD_LIMIT_MB) {
  const limitBytes = limitMB * 1024 * 1024;
  return sizeInBytes > limitBytes;
}

/**
 * Formats bytes as a human-readable string.
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "2.5 MB", "512 KB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
