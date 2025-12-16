/**
 * Utils Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  formatDate,
  sanitizeFilename,
  isValidEmail,
  safeParseFloat,
} from '../utils.js';

describe('formatDate', () => {
  test('formats Date object to YYYY-MM-DD', () => {
    const date = new Date('2025-03-15T12:00:00');
    expect(formatDate(date)).toBe('2025-03-15');
  });

  test('formats date string to YYYY-MM-DD', () => {
    expect(formatDate('2025-12-25')).toBe('2025-12-25');
  });

  test('handles single digit month and day', () => {
    const date = new Date('2025-01-05T12:00:00');
    expect(formatDate(date)).toBe('2025-01-05');
  });
});

describe('sanitizeFilename', () => {
  test('replaces spaces with underscores', () => {
    expect(sanitizeFilename('my file name')).toBe('my_file_name');
  });

  test('replaces special characters with underscores', () => {
    expect(sanitizeFilename('file@name#123!')).toBe('file_name_123_');
  });

  test('keeps alphanumeric characters', () => {
    expect(sanitizeFilename('ValidFilename123')).toBe('ValidFilename123');
  });

  test('handles empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('isValidEmail', () => {
  test('accepts valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.nz')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  test('rejects invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('safeParseFloat', () => {
  test('parses valid numbers', () => {
    expect(safeParseFloat('123.45')).toBe(123.45);
    expect(safeParseFloat('100')).toBe(100);
    expect(safeParseFloat(42.5)).toBe(42.5);
  });

  test('returns default value for invalid input', () => {
    expect(safeParseFloat('not a number')).toBe(0);
    expect(safeParseFloat('')).toBe(0);
    expect(safeParseFloat(undefined)).toBe(0);
  });

  test('uses custom default value', () => {
    expect(safeParseFloat('invalid', 99)).toBe(99);
    expect(safeParseFloat(null, -1)).toBe(-1);
  });

  test('handles edge cases', () => {
    expect(safeParseFloat('0')).toBe(0);
    expect(safeParseFloat('-50.5')).toBe(-50.5);
  });
});
