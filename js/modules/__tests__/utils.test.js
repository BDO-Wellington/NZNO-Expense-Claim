/**
 * Utils Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  formatDate,
  sanitizeFilename,
  isValidEmail,
  safeParseFloat,
  getBase64SizeInBytes,
  calculatePayloadSize,
  exceedsPayloadLimit,
  formatBytes,
  DEFAULT_PAYLOAD_LIMIT_MB,
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

// ============================================================================
// Payload Size Utilities Tests
// ============================================================================

describe('getBase64SizeInBytes', () => {
  test('calculates correct size for simple Base64 string', () => {
    // "Hello" in Base64 is "SGVsbG8=" (5 bytes -> 8 chars with padding)
    const base64 = btoa('Hello');
    expect(getBase64SizeInBytes(base64)).toBe(5);
  });

  test('handles Base64 without padding', () => {
    // "Hi" in Base64 is "SGk=" (2 bytes -> 4 chars with 1 padding)
    const base64 = btoa('Hi');
    expect(getBase64SizeInBytes(base64)).toBe(2);
  });

  test('handles longer strings', () => {
    // 100 characters -> 100 bytes
    const original = 'a'.repeat(100);
    const base64 = btoa(original);
    expect(getBase64SizeInBytes(base64)).toBe(100);
  });

  test('returns 0 for null input', () => {
    expect(getBase64SizeInBytes(null)).toBe(0);
  });

  test('returns 0 for undefined input', () => {
    expect(getBase64SizeInBytes(undefined)).toBe(0);
  });

  test('returns 0 for empty string', () => {
    expect(getBase64SizeInBytes('')).toBe(0);
  });

  test('returns 0 for non-string input', () => {
    expect(getBase64SizeInBytes(12345)).toBe(0);
  });
});

describe('calculatePayloadSize', () => {
  test('returns 0 for null attachments', () => {
    expect(calculatePayloadSize(null)).toBe(0);
  });

  test('returns base overhead for empty array', () => {
    // Empty array still has payload overhead (~2KB)
    const size = calculatePayloadSize([]);
    expect(size).toBe(2000); // Payload overhead constant
  });

  test('calculates size for single attachment', () => {
    const attachments = [{
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      content: btoa('test content')
    }];
    const size = calculatePayloadSize(attachments);
    // Content length + metadata overhead + payload overhead
    expect(size).toBeGreaterThan(2000); // More than just overhead
    expect(size).toBeLessThan(10000); // Sanity check
  });

  test('adds ~34% overhead when stringifying for Zapier', () => {
    // Use larger content to minimize effect of fixed overhead
    const attachments = [{
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      content: 'a'.repeat(100000) // 100KB content
    }];
    const sizeWithout = calculatePayloadSize(attachments, false);
    const sizeWith = calculatePayloadSize(attachments, true);

    // With stringify should be ~34% larger (for large payloads)
    const ratio = sizeWith / sizeWithout;
    expect(ratio).toBeGreaterThan(1.3);
    expect(ratio).toBeLessThan(1.4);
  });

  test('accumulates size for multiple attachments', () => {
    // Use larger content to test accumulation
    const single = [{
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      content: 'a'.repeat(10000) // 10KB
    }];
    const double = [
      { fileName: 'test1.pdf', mimeType: 'application/pdf', content: 'a'.repeat(10000) },
      { fileName: 'test2.pdf', mimeType: 'application/pdf', content: 'a'.repeat(10000) }
    ];

    const singleSize = calculatePayloadSize(single);
    const doubleSize = calculatePayloadSize(double);

    // Double should be noticeably larger than single
    expect(doubleSize).toBeGreaterThan(singleSize);
    // Content portion should roughly double
    const singleContent = singleSize - 2000 - 100; // Remove overhead
    const doubleContent = doubleSize - 2000 - 200; // Remove overhead
    expect(doubleContent).toBeGreaterThan(singleContent * 1.8);
  });
});

describe('exceedsPayloadLimit', () => {
  test('returns false for size under default limit', () => {
    const underLimit = 1 * 1024 * 1024; // 1 MB
    expect(exceedsPayloadLimit(underLimit)).toBe(false);
  });

  test('returns true for size over default limit', () => {
    const overLimit = 3 * 1024 * 1024; // 3 MB (default is 2.5 MB)
    expect(exceedsPayloadLimit(overLimit)).toBe(true);
  });

  test('uses custom limit when provided', () => {
    const size = 1.5 * 1024 * 1024; // 1.5 MB
    expect(exceedsPayloadLimit(size, 2)).toBe(false); // Under 2 MB
    expect(exceedsPayloadLimit(size, 1)).toBe(true);  // Over 1 MB
  });

  test('returns false for exactly at limit', () => {
    const exactLimit = DEFAULT_PAYLOAD_LIMIT_MB * 1024 * 1024;
    expect(exceedsPayloadLimit(exactLimit)).toBe(false);
  });

  test('returns true for 1 byte over limit', () => {
    const justOver = (DEFAULT_PAYLOAD_LIMIT_MB * 1024 * 1024) + 1;
    expect(exceedsPayloadLimit(justOver)).toBe(true);
  });
});

describe('formatBytes', () => {
  test('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  test('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  test('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  test('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  test('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('DEFAULT_PAYLOAD_LIMIT_MB', () => {
  test('is set to 2.5 MB', () => {
    expect(DEFAULT_PAYLOAD_LIMIT_MB).toBe(2.5);
  });
});
