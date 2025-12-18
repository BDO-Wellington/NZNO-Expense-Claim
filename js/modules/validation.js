/**
 * Form Validation Module
 * Purpose: Real-time form validation with visual feedback
 * Author: Claude Code
 * Date: December 2025
 *
 * Features:
 * - Real-time blur validation
 * - Error clearing on input
 * - Valid/invalid visual states
 * - Form-level error summary
 * - Accessible error messages
 */

/**
 * Validation rules for form fields
 */
const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    messages: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name must be less than 100 characters',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  employeeId: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9\-]+$/,
    messages: {
      required: 'Employee ID is required',
      minLength: 'Employee ID is required',
      maxLength: 'Employee ID must be less than 20 characters',
      pattern: 'Employee ID can only contain letters, numbers, and hyphens'
    }
  },
  expenseDate: {
    required: true,
    custom: (value) => {
      const date = new Date(value);
      // Check for invalid date (e.g., "invalid" or malformed input)
      if (isNaN(date.getTime())) {
        return 'Please enter a valid date';
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        return 'Expense date cannot be in the future';
      }
      return null;
    },
    messages: {
      required: 'Expense date is required'
    }
  }
};

/**
 * Tracks validation state for each field
 * @type {Map<string, boolean>}
 */
const fieldValidationState = new Map();

/**
 * Creates an error message element
 * @param {string} message - Error message text
 * @param {string} fieldId - Associated field ID
 * @returns {HTMLElement} Error element
 */
function createErrorElement(message, fieldId) {
  const error = document.createElement('div');
  error.className = 'validation-error';
  error.id = `${fieldId}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  error.textContent = message;
  return error;
}

/**
 * Creates a valid indicator element
 * @returns {HTMLElement} Valid indicator element
 */
function createValidIndicator() {
  const indicator = document.createElement('span');
  indicator.className = 'validation-valid-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M6.5 12L2 7.5L3.5 6L6.5 9L12.5 3L14 4.5L6.5 12Z');
  path.setAttribute('fill', 'currentColor');

  svg.appendChild(path);
  indicator.appendChild(svg);
  return indicator;
}

/**
 * Creates an invalid indicator element
 * @returns {HTMLElement} Invalid indicator element
 */
function createInvalidIndicator() {
  const indicator = document.createElement('span');
  indicator.className = 'validation-invalid-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12.5 4.5L11 3L8 6L5 3L3.5 4.5L6.5 7.5L3.5 10.5L5 12L8 9L11 12L12.5 10.5L9.5 7.5L12.5 4.5Z');
  path.setAttribute('fill', 'currentColor');

  svg.appendChild(path);
  indicator.appendChild(svg);
  return indicator;
}

/**
 * Validates a single field value against its rules
 * @param {string} fieldId - Field identifier
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateField(fieldId, value) {
  const rules = VALIDATION_RULES[fieldId];
  if (!rules) return null;

  const trimmedValue = value.trim();

  // Required check
  if (rules.required && !trimmedValue) {
    return rules.messages.required;
  }

  // Skip other validations if empty and not required
  if (!trimmedValue) return null;

  // Min length check
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return rules.messages.minLength;
  }

  // Max length check
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return rules.messages.maxLength;
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return rules.messages.pattern;
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(trimmedValue);
    if (customError) return customError;
  }

  return null;
}

/**
 * Shows validation error for a field
 * @param {HTMLInputElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
  const fieldId = input.id;
  const container = input.closest('.form-group') || input.parentNode;

  // Remove any existing error/valid states
  clearFieldValidation(input);

  // Add invalid state
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', `${fieldId}-error`);

  // Add error message
  const errorEl = createErrorElement(message, fieldId);
  container.appendChild(errorEl);

  // Add invalid indicator
  const indicator = createInvalidIndicator();
  container.appendChild(indicator);

  // Update state
  fieldValidationState.set(fieldId, false);
}

/**
 * Shows valid state for a field
 * @param {HTMLInputElement} input - Input element
 */
function showFieldValid(input) {
  const fieldId = input.id;
  const container = input.closest('.form-group') || input.parentNode;

  // Remove any existing error/valid states
  clearFieldValidation(input);

  // Add valid state
  input.classList.add('is-valid');
  input.setAttribute('aria-invalid', 'false');

  // Add valid indicator
  const indicator = createValidIndicator();
  container.appendChild(indicator);

  // Update state
  fieldValidationState.set(fieldId, true);
}

/**
 * Clears validation state for a field
 * @param {HTMLInputElement} input - Input element
 */
export function clearFieldValidation(input) {
  const fieldId = input.id;
  const container = input.closest('.form-group') || input.parentNode;

  // Remove classes
  input.classList.remove('is-valid', 'is-invalid');
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');

  // Remove error message
  const errorEl = container.querySelector('.validation-error');
  if (errorEl) errorEl.remove();

  // Remove indicators
  const validIndicator = container.querySelector('.validation-valid-indicator');
  const invalidIndicator = container.querySelector('.validation-invalid-indicator');
  if (validIndicator) validIndicator.remove();
  if (invalidIndicator) invalidIndicator.remove();

  // Update state
  fieldValidationState.delete(fieldId);
}

/**
 * Validates and shows feedback for a field
 * @param {HTMLInputElement} input - Input element
 * @returns {boolean} True if valid
 */
export function validateAndShowFeedback(input) {
  const fieldId = input.id;
  const value = input.value;

  const error = validateField(fieldId, value);

  if (error) {
    showFieldError(input, error);
    return false;
  } else if (value.trim()) {
    showFieldValid(input);
    return true;
  } else {
    // Empty but not required - clear validation
    clearFieldValidation(input);
    return true;
  }
}

/**
 * Validates all required fields in the form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if all fields are valid
 */
export function validateForm(form) {
  let isValid = true;
  const errors = [];

  // Validate each field with rules
  Object.keys(VALIDATION_RULES).forEach(fieldId => {
    const input = form.querySelector(`#${fieldId}`);
    if (input) {
      const error = validateField(fieldId, input.value);
      if (error) {
        showFieldError(input, error);
        errors.push({ fieldId, message: error });
        isValid = false;
      } else if (input.value.trim()) {
        showFieldValid(input);
      }
    }
  });

  // Show error summary if there are errors
  if (errors.length > 0) {
    showErrorSummary(form, errors);
    // Focus first invalid field
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.focus();
  } else {
    hideErrorSummary(form);
  }

  return isValid;
}

/**
 * Shows error summary at top of form
 * @param {HTMLFormElement} form - Form element
 * @param {Array<{fieldId: string, message: string}>} errors - Array of errors
 */
function showErrorSummary(form, errors) {
  // Remove existing summary
  hideErrorSummary(form);

  const summary = document.createElement('div');
  summary.className = 'validation-summary';
  summary.setAttribute('role', 'alert');
  summary.setAttribute('aria-live', 'polite');

  const title = document.createElement('h4');
  title.className = 'validation-summary-title';
  title.textContent = 'Please correct the following errors:';
  summary.appendChild(title);

  const list = document.createElement('ul');
  list.className = 'validation-summary-list';

  errors.forEach(error => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${error.fieldId}`;
    link.textContent = error.message;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const input = form.querySelector(`#${error.fieldId}`);
      if (input) input.focus();
    });
    item.appendChild(link);
    list.appendChild(item);
  });

  summary.appendChild(list);

  // Insert at beginning of form
  form.insertBefore(summary, form.firstChild);
}

/**
 * Hides error summary
 * @param {HTMLFormElement} form - Form element
 */
function hideErrorSummary(form) {
  const summary = form.querySelector('.validation-summary');
  if (summary) summary.remove();
}

/**
 * Sets up real-time validation on form fields
 * @param {HTMLFormElement} form - Form element
 */
export function setupFormValidation(form) {
  // Validate on blur
  Object.keys(VALIDATION_RULES).forEach(fieldId => {
    const input = form.querySelector(`#${fieldId}`);
    if (input) {
      // Validate on blur
      input.addEventListener('blur', () => {
        validateAndShowFeedback(input);
      });

      // Clear error on input (give user a chance to correct)
      input.addEventListener('input', () => {
        // Only clear if currently showing error
        if (input.classList.contains('is-invalid')) {
          clearFieldValidation(input);
        }
      });
    }
  });

  // Validate on form submit
  form.addEventListener('submit', (e) => {
    if (!validateForm(form)) {
      e.preventDefault();
    }
  }, true);
}

/**
 * Clears all validation states in the form
 * @param {HTMLFormElement} form - Form element
 */
export function clearFormValidation(form) {
  Object.keys(VALIDATION_RULES).forEach(fieldId => {
    const input = form.querySelector(`#${fieldId}`);
    if (input) {
      clearFieldValidation(input);
    }
  });
  hideErrorSummary(form);
  fieldValidationState.clear();
}

// Export for testing
export { VALIDATION_RULES };
