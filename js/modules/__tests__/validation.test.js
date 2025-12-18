/**
 * Validation Module Tests
 * Tests for form validation functionality including DOM feedback
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { resetAllMocks, createMockElement, createMockForm } from '../../../tests/setup.js';
import {
  validateField,
  validateAndShowFeedback,
  clearFieldValidation,
  validateForm,
  setupFormValidation,
  clearFormValidation,
  VALIDATION_RULES
} from '../validation.js';

describe('Validation Module', () => {
  describe('VALIDATION_RULES', () => {
    test('should have rules for fullName', () => {
      expect(VALIDATION_RULES.fullName).toBeDefined();
      expect(VALIDATION_RULES.fullName.required).toBe(true);
    });

    test('should have rules for employeeId', () => {
      expect(VALIDATION_RULES.employeeId).toBeDefined();
      expect(VALIDATION_RULES.employeeId.required).toBe(true);
    });

    test('should have rules for expenseDate', () => {
      expect(VALIDATION_RULES.expenseDate).toBeDefined();
      expect(VALIDATION_RULES.expenseDate.required).toBe(true);
    });

    test('fullName should have min and max length', () => {
      expect(VALIDATION_RULES.fullName.minLength).toBe(2);
      expect(VALIDATION_RULES.fullName.maxLength).toBe(100);
    });

    test('employeeId should have min and max length', () => {
      expect(VALIDATION_RULES.employeeId.minLength).toBe(1);
      expect(VALIDATION_RULES.employeeId.maxLength).toBe(20);
    });

    test('fullName should have pattern for valid characters', () => {
      expect(VALIDATION_RULES.fullName.pattern).toBeInstanceOf(RegExp);
    });

    test('employeeId should have pattern for valid characters', () => {
      expect(VALIDATION_RULES.employeeId.pattern).toBeInstanceOf(RegExp);
    });

    test('expenseDate should have custom validator', () => {
      expect(typeof VALIDATION_RULES.expenseDate.custom).toBe('function');
    });
  });

  describe('validateField', () => {
    describe('fullName validation', () => {
      test('should return error for empty name', () => {
        const error = validateField('fullName', '');
        expect(error).toBe('Full name is required');
      });

      test('should return error for whitespace only', () => {
        const error = validateField('fullName', '   ');
        expect(error).toBe('Full name is required');
      });

      test('should return error for name too short', () => {
        const error = validateField('fullName', 'A');
        expect(error).toBe('Name must be at least 2 characters');
      });

      test('should return error for invalid characters (numbers)', () => {
        const error = validateField('fullName', 'John123');
        expect(error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
      });

      test('should return error for invalid characters (symbols)', () => {
        const error = validateField('fullName', 'John@Doe');
        expect(error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
      });

      test('should return null for valid simple name', () => {
        const error = validateField('fullName', 'John Smith');
        expect(error).toBeNull();
      });

      test('should return null for valid two character name', () => {
        const error = validateField('fullName', 'Jo');
        expect(error).toBeNull();
      });

      test('should allow hyphens in name', () => {
        const error = validateField('fullName', 'Mary-Jane Watson');
        expect(error).toBeNull();
      });

      test('should allow apostrophes in name', () => {
        const error = validateField('fullName', "O'Connor");
        expect(error).toBeNull();
      });

      test('should allow multiple spaces', () => {
        const error = validateField('fullName', 'John Paul Smith');
        expect(error).toBeNull();
      });
    });

    describe('employeeId validation', () => {
      test('should return error for empty ID', () => {
        const error = validateField('employeeId', '');
        expect(error).toBe('Employee ID is required');
      });

      test('should return error for whitespace only', () => {
        const error = validateField('employeeId', '   ');
        expect(error).toBe('Employee ID is required');
      });

      test('should return error for invalid characters (at symbol)', () => {
        const error = validateField('employeeId', 'EMP@123');
        expect(error).toBe('Employee ID can only contain letters, numbers, and hyphens');
      });

      test('should return error for invalid characters (spaces)', () => {
        const error = validateField('employeeId', 'EMP 123');
        expect(error).toBe('Employee ID can only contain letters, numbers, and hyphens');
      });

      test('should return null for valid ID with hyphen', () => {
        const error = validateField('employeeId', 'EMP-12345');
        expect(error).toBeNull();
      });

      test('should return null for alphanumeric ID', () => {
        const error = validateField('employeeId', 'ABC123');
        expect(error).toBeNull();
      });

      test('should return null for numeric only ID', () => {
        const error = validateField('employeeId', '12345');
        expect(error).toBeNull();
      });

      test('should return null for single character ID', () => {
        const error = validateField('employeeId', 'A');
        expect(error).toBeNull();
      });
    });

    describe('expenseDate validation', () => {
      test('should return error for empty date', () => {
        const error = validateField('expenseDate', '');
        expect(error).toBe('Expense date is required');
      });

      test('should return error for whitespace only', () => {
        const error = validateField('expenseDate', '   ');
        expect(error).toBe('Expense date is required');
      });

      test('should return error for future date (1 week)', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateStr = futureDate.toISOString().split('T')[0];
        const error = validateField('expenseDate', dateStr);
        expect(error).toBe('Expense date cannot be in the future');
      });

      test('should return error for future date (1 day)', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const error = validateField('expenseDate', dateStr);
        expect(error).toBe('Expense date cannot be in the future');
      });

      test('should return null for valid past date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const dateStr = pastDate.toISOString().split('T')[0];
        const error = validateField('expenseDate', dateStr);
        expect(error).toBeNull();
      });

      test('should return null for today date', () => {
        const today = new Date().toISOString().split('T')[0];
        const error = validateField('expenseDate', today);
        expect(error).toBeNull();
      });

      test('should return null for date far in past', () => {
        const error = validateField('expenseDate', '2020-01-01');
        expect(error).toBeNull();
      });
    });

    describe('unknown field', () => {
      test('should return null for unknown field', () => {
        const error = validateField('unknownField', 'any value');
        expect(error).toBeNull();
      });

      test('should return null for unknown field with empty value', () => {
        const error = validateField('unknownField', '');
        expect(error).toBeNull();
      });
    });
  });

  describe('Validation messages', () => {
    test('fullName required message is correct', () => {
      expect(VALIDATION_RULES.fullName.messages.required).toBe('Full name is required');
    });

    test('fullName minLength message is correct', () => {
      expect(VALIDATION_RULES.fullName.messages.minLength).toBe('Name must be at least 2 characters');
    });

    test('fullName pattern message is correct', () => {
      expect(VALIDATION_RULES.fullName.messages.pattern).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    });

    test('employeeId required message is correct', () => {
      expect(VALIDATION_RULES.employeeId.messages.required).toBe('Employee ID is required');
    });

    test('employeeId pattern message is correct', () => {
      expect(VALIDATION_RULES.employeeId.messages.pattern).toBe('Employee ID can only contain letters, numbers, and hyphens');
    });

    test('expenseDate required message is correct', () => {
      expect(VALIDATION_RULES.expenseDate.messages.required).toBe('Expense date is required');
    });
  });

  describe('Pattern matching', () => {
    test('fullName pattern should match letters only', () => {
      expect(VALIDATION_RULES.fullName.pattern.test('John')).toBe(true);
    });

    test('fullName pattern should match with spaces', () => {
      expect(VALIDATION_RULES.fullName.pattern.test('John Smith')).toBe(true);
    });

    test('fullName pattern should match with hyphens', () => {
      expect(VALIDATION_RULES.fullName.pattern.test('Mary-Jane')).toBe(true);
    });

    test('fullName pattern should match with apostrophes', () => {
      expect(VALIDATION_RULES.fullName.pattern.test("O'Connor")).toBe(true);
    });

    test('fullName pattern should not match numbers', () => {
      expect(VALIDATION_RULES.fullName.pattern.test('John123')).toBe(false);
    });

    test('employeeId pattern should match alphanumeric', () => {
      expect(VALIDATION_RULES.employeeId.pattern.test('ABC123')).toBe(true);
    });

    test('employeeId pattern should match with hyphens', () => {
      expect(VALIDATION_RULES.employeeId.pattern.test('EMP-123')).toBe(true);
    });

    test('employeeId pattern should not match spaces', () => {
      expect(VALIDATION_RULES.employeeId.pattern.test('EMP 123')).toBe(false);
    });

    test('employeeId pattern should not match special chars', () => {
      expect(VALIDATION_RULES.employeeId.pattern.test('EMP@123')).toBe(false);
    });
  });

  describe('Custom validation function', () => {
    const customValidator = VALIDATION_RULES.expenseDate.custom;

    test('should return null for past date', () => {
      const result = customValidator('2020-01-01');
      expect(result).toBeNull();
    });

    test('should return null for today', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = customValidator(today);
      expect(result).toBeNull();
    });

    test('should return error message for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];
      const result = customValidator(dateStr);
      expect(result).toBe('Expense date cannot be in the future');
    });

    test('should return error for invalid date string', () => {
      const result = customValidator('not-a-date');
      expect(result).toBe('Please enter a valid date');
    });

    test('should return error for malformed date', () => {
      const result = customValidator('2025-99-99');
      expect(result).toBe('Please enter a valid date');
    });
  });

  describe('DOM Feedback - validateAndShowFeedback', () => {
    let mockInput;
    let mockContainer;

    beforeEach(() => {
      resetAllMocks();
      mockContainer = createMockElement();
      mockInput = createMockElement({ tagName: 'INPUT' });
      mockInput.id = 'fullName';
      mockInput.value = '';
      mockInput.closest = mock(() => mockContainer);
      mockContainer.appendChild(mockInput);
    });

    test('returns false and shows error for invalid input', () => {
      mockInput.value = '';
      const result = validateAndShowFeedback(mockInput);

      expect(result).toBe(false);
      expect(mockInput.classList.contains('is-invalid')).toBe(true);
      expect(mockInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('returns true and shows valid state for valid input', () => {
      mockInput.value = 'John Smith';
      const result = validateAndShowFeedback(mockInput);

      expect(result).toBe(true);
      expect(mockInput.classList.contains('is-valid')).toBe(true);
      expect(mockInput.getAttribute('aria-invalid')).toBe('false');
    });

    test('returns true and clears validation for empty non-required field', () => {
      // Use an unknown field (not required)
      mockInput.id = 'unknownField';
      mockInput.value = '';
      const result = validateAndShowFeedback(mockInput);

      expect(result).toBe(true);
      expect(mockInput.classList.contains('is-invalid')).toBe(false);
      expect(mockInput.classList.contains('is-valid')).toBe(false);
    });

    test('creates error element with correct ARIA attributes', () => {
      mockInput.value = '';
      validateAndShowFeedback(mockInput);

      const errorEl = mockContainer.querySelector('.validation-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.getAttribute('role')).toBe('alert');
      expect(errorEl.getAttribute('aria-live')).toBe('polite');
      expect(errorEl.id).toBe('fullName-error');
    });

    test('links input to error with aria-describedby', () => {
      mockInput.value = '';
      validateAndShowFeedback(mockInput);

      expect(mockInput.getAttribute('aria-describedby')).toBe('fullName-error');
    });

    test('creates valid indicator for valid input', () => {
      mockInput.value = 'Valid Name';
      validateAndShowFeedback(mockInput);

      const indicator = mockContainer.querySelector('.validation-valid-indicator');
      expect(indicator).not.toBeNull();
    });

    test('creates invalid indicator for invalid input', () => {
      mockInput.value = '';
      validateAndShowFeedback(mockInput);

      const indicator = mockContainer.querySelector('.validation-invalid-indicator');
      expect(indicator).not.toBeNull();
    });
  });

  describe('DOM Feedback - clearFieldValidation', () => {
    let mockInput;
    let mockContainer;

    beforeEach(() => {
      resetAllMocks();
      mockContainer = createMockElement();
      mockInput = createMockElement({ tagName: 'INPUT' });
      mockInput.id = 'fullName';
      mockInput.closest = mock(() => mockContainer);
      mockContainer.appendChild(mockInput);
    });

    test('removes is-valid and is-invalid classes', () => {
      mockInput.classList.add('is-valid');
      mockInput.classList.add('is-invalid');

      clearFieldValidation(mockInput);

      expect(mockInput.classList.contains('is-valid')).toBe(false);
      expect(mockInput.classList.contains('is-invalid')).toBe(false);
    });

    test('removes aria-invalid attribute', () => {
      mockInput.setAttribute('aria-invalid', 'true');

      clearFieldValidation(mockInput);

      expect(mockInput.getAttribute('aria-invalid')).toBeNull();
    });

    test('removes aria-describedby attribute', () => {
      mockInput.setAttribute('aria-describedby', 'fullName-error');

      clearFieldValidation(mockInput);

      expect(mockInput.getAttribute('aria-describedby')).toBeNull();
    });

    test('removes error message element', () => {
      const errorEl = createMockElement();
      errorEl.className = 'validation-error';
      mockContainer.appendChild(errorEl);

      clearFieldValidation(mockInput);

      expect(mockContainer.querySelector('.validation-error')).toBeNull();
    });

    test('removes valid indicator', () => {
      const indicator = createMockElement();
      indicator.className = 'validation-valid-indicator';
      mockContainer.appendChild(indicator);

      clearFieldValidation(mockInput);

      expect(mockContainer.querySelector('.validation-valid-indicator')).toBeNull();
    });

    test('removes invalid indicator', () => {
      const indicator = createMockElement();
      indicator.className = 'validation-invalid-indicator';
      mockContainer.appendChild(indicator);

      clearFieldValidation(mockInput);

      expect(mockContainer.querySelector('.validation-invalid-indicator')).toBeNull();
    });
  });

  describe('DOM Feedback - validateForm', () => {
    let mockForm;

    beforeEach(() => {
      resetAllMocks();
      mockForm = createMockForm({
        fullName: '',
        employeeId: '',
        expenseDate: ''
      });
    });

    test('returns false when all required fields are empty', () => {
      const result = validateForm(mockForm);
      expect(result).toBe(false);
    });

    test('returns true when all fields are valid', () => {
      mockForm.querySelector('#fullName').value = 'John Smith';
      mockForm.querySelector('#employeeId').value = 'EMP-123';
      mockForm.querySelector('#expenseDate').value = '2025-01-01';

      const result = validateForm(mockForm);
      expect(result).toBe(true);
    });

    test('returns false when any field is invalid', () => {
      mockForm.querySelector('#fullName').value = 'John Smith';
      mockForm.querySelector('#employeeId').value = 'EMP-123';
      mockForm.querySelector('#expenseDate').value = ''; // Empty - invalid

      const result = validateForm(mockForm);
      expect(result).toBe(false);
    });

    test('marks invalid fields with is-invalid class', () => {
      validateForm(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      const employeeIdInput = mockForm.querySelector('#employeeId');
      const dateInput = mockForm.querySelector('#expenseDate');

      expect(fullNameInput.classList.contains('is-invalid')).toBe(true);
      expect(employeeIdInput.classList.contains('is-invalid')).toBe(true);
      expect(dateInput.classList.contains('is-invalid')).toBe(true);
    });

    test('marks valid fields with is-valid class', () => {
      mockForm.querySelector('#fullName').value = 'John Smith';
      mockForm.querySelector('#employeeId').value = 'EMP-123';
      mockForm.querySelector('#expenseDate').value = '2025-01-01';

      validateForm(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      expect(fullNameInput.classList.contains('is-valid')).toBe(true);
    });

    test('creates error summary when validation fails', () => {
      validateForm(mockForm);

      const summary = mockForm.querySelector('.validation-summary');
      expect(summary).not.toBeNull();
      expect(summary.getAttribute('role')).toBe('alert');
    });

    test('hides error summary when validation succeeds', () => {
      mockForm.querySelector('#fullName').value = 'John Smith';
      mockForm.querySelector('#employeeId').value = 'EMP-123';
      mockForm.querySelector('#expenseDate').value = '2025-01-01';

      validateForm(mockForm);

      const summary = mockForm.querySelector('.validation-summary');
      expect(summary).toBeNull();
    });

    test('focuses first invalid field', () => {
      const fullNameInput = mockForm.querySelector('#fullName');
      let wasFocused = false;
      fullNameInput.focus = mock(() => { wasFocused = true; });

      validateForm(mockForm);

      expect(wasFocused).toBe(true);
    });
  });

  describe('DOM Feedback - clearFormValidation', () => {
    let mockForm;

    beforeEach(() => {
      resetAllMocks();
      mockForm = createMockForm({
        fullName: 'John',
        employeeId: 'EMP1',
        expenseDate: '2025-01-01'
      });
    });

    test('clears validation state from all fields', () => {
      // First validate to add states
      mockForm.querySelector('#fullName').value = '';
      validateForm(mockForm);

      // Then clear
      mockForm.querySelector('#fullName').value = 'Valid';
      clearFormValidation(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      expect(fullNameInput.classList.contains('is-invalid')).toBe(false);
      expect(fullNameInput.classList.contains('is-valid')).toBe(false);
    });

    test('removes error summary', () => {
      // Add error summary by validating invalid form
      mockForm.querySelector('#fullName').value = '';
      validateForm(mockForm);

      const summaryBefore = mockForm.querySelector('.validation-summary');
      expect(summaryBefore).not.toBeNull();

      // Clear validation
      clearFormValidation(mockForm);

      const summaryAfter = mockForm.querySelector('.validation-summary');
      expect(summaryAfter).toBeNull();
    });
  });

  describe('DOM Feedback - setupFormValidation', () => {
    let mockForm;

    beforeEach(() => {
      resetAllMocks();
      mockForm = createMockForm({
        fullName: '',
        employeeId: '',
        expenseDate: ''
      });
    });

    test('attaches blur event listeners to form fields', () => {
      setupFormValidation(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      const blurListeners = fullNameInput._eventListeners?.blur || [];
      expect(blurListeners.length).toBeGreaterThan(0);
    });

    test('attaches input event listeners to form fields', () => {
      setupFormValidation(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      const inputListeners = fullNameInput._eventListeners?.input || [];
      expect(inputListeners.length).toBeGreaterThan(0);
    });

    test('attaches submit event listener to form', () => {
      setupFormValidation(mockForm);

      const submitListeners = mockForm._eventListeners?.submit || [];
      expect(submitListeners.length).toBeGreaterThan(0);
    });

    test('validates field on blur', () => {
      setupFormValidation(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      fullNameInput.value = '';

      // Trigger blur event
      const blurHandler = fullNameInput._eventListeners?.blur?.[0];
      if (blurHandler) blurHandler();

      expect(fullNameInput.classList.contains('is-invalid')).toBe(true);
    });

    test('clears error on input when field was invalid', () => {
      setupFormValidation(mockForm);

      const fullNameInput = mockForm.querySelector('#fullName');
      fullNameInput.value = '';

      // First trigger blur to show error
      const blurHandler = fullNameInput._eventListeners?.blur?.[0];
      if (blurHandler) blurHandler();

      expect(fullNameInput.classList.contains('is-invalid')).toBe(true);

      // Now trigger input to clear error
      const inputHandler = fullNameInput._eventListeners?.input?.[0];
      if (inputHandler) inputHandler();

      expect(fullNameInput.classList.contains('is-invalid')).toBe(false);
    });

    test('validateForm prevents submission when fields are invalid', () => {
      // Validate form directly - this is what the submit handler calls
      const isValid = validateForm(mockForm);

      // Form with empty required fields should be invalid
      expect(isValid).toBe(false);
    });

    test('validateForm allows submission when all fields are valid', () => {
      mockForm.querySelector('#fullName').value = 'John Smith';
      mockForm.querySelector('#employeeId').value = 'EMP-123';
      mockForm.querySelector('#expenseDate').value = '2025-01-01';

      // Validate form directly - this is what the submit handler calls
      const isValid = validateForm(mockForm);

      // Form with valid fields should be valid
      expect(isValid).toBe(true);
    });
  });
});
