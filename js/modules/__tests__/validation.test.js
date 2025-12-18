/**
 * Validation Module Tests
 * Tests for form validation functionality
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import {
  validateField,
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
  });
});
