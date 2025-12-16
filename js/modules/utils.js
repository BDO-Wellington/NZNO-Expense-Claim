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
 * Formats a date object to YYYY-MM-DD string.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
 * Gets today's date in YYYY-MM-DD format.
 * @returns {string} Today's date
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
