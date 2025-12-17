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
  // Tests use NZ timezone (Pacific/Auckland) - UTC+12 in winter, UTC+13 in summer
  test('formats Date object to YYYY-MM-DD in NZ timezone', () => {
    // Use a date with explicit NZ time to ensure correct date
    const date = new Date('2025-03-15T12:00:00+13:00'); // March 15 noon NZDT
    expect(formatDate(date)).toBe('2025-03-15');
  });

  test('formats date string to YYYY-MM-DD', () => {
    // Date-only strings are parsed at midnight local/NZ time
    expect(formatDate('2025-12-25T00:00:00+13:00')).toBe('2025-12-25');
  });

  test('handles single digit month and day', () => {
    // January is NZDT (UTC+13)
    const date = new Date('2025-01-05T12:00:00+13:00');
    expect(formatDate(date)).toBe('2025-01-05');
  });
});

describe('sanitizeFilename', () => {
  test.each([
    { input: 'my file name', expected: 'my_file_name', desc: 'replaces spaces with underscores' },
    { input: 'file@name#123!', expected: 'file_name_123_', desc: 'replaces special characters' },
    { input: 'ValidFilename123', expected: 'ValidFilename123', desc: 'keeps alphanumeric characters' },
    { input: '', expected: '', desc: 'handles empty string' },
  ])('$desc: "$input" -> "$expected"', ({ input, expected }) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });
});

describe('isValidEmail', () => {
  describe('valid emails', () => {
    test.each([
      { email: 'test@example.com', desc: 'standard email' },
      { email: 'user.name@domain.co.nz', desc: 'email with dots and country TLD' },
      { email: 'user+tag@example.org', desc: 'email with plus tag' },
      { email: 'firstname.lastname@company.com', desc: 'professional email format' },
    ])('accepts $desc: $email', ({ email }) => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  describe('invalid emails', () => {
    test.each([
      { email: 'invalid', desc: 'no @ symbol' },
      { email: 'missing@domain', desc: 'no TLD' },
      { email: '@nodomain.com', desc: 'no local part' },
      { email: 'spaces in@email.com', desc: 'contains spaces' },
      { email: '', desc: 'empty string' },
      { email: 'double@@at.com', desc: 'double @ symbol' },
      { email: 'nodot@domaincom', desc: 'missing dot in domain' },
    ])('rejects $desc: "$email"', ({ email }) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('safeParseFloat', () => {
  describe('valid numbers', () => {
    test.each([
      { input: '123.45', expected: 123.45 },
      { input: '100', expected: 100 },
      { input: 42.5, expected: 42.5 },
      { input: '0', expected: 0 },
      { input: '-50.5', expected: -50.5 },
    ])('parses $input to $expected', ({ input, expected }) => {
      expect(safeParseFloat(input)).toBe(expected);
    });
  });

  describe('invalid inputs with default value', () => {
    test.each([
      { input: 'not a number', defaultVal: 0, expected: 0 },
      { input: '', defaultVal: 0, expected: 0 },
      { input: undefined, defaultVal: 0, expected: 0 },
      { input: 'invalid', defaultVal: 99, expected: 99 },
      { input: null, defaultVal: -1, expected: -1 },
    ])('returns $expected for "$input" with default $defaultVal', ({ input, defaultVal, expected }) => {
      expect(safeParseFloat(input, defaultVal)).toBe(expected);
    });
  });
});
