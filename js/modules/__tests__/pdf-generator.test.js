/**
 * PDF Generator Module Tests
 */
import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { createMockElement, resetAllMocks } from '../../../tests/setup.js';
import {
  getDynamicPdfFilename,
  getAttachmentsPdfFilename,
  isHtml2PdfAvailable,
  isJsPdfAvailable,
  validatePdfLibraries,
} from '../pdf-generator.js';

describe('getDynamicPdfFilename', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('generates filename from form inputs', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'John Smith' };
      if (id === 'expenseDate') return { value: '2025-12-15' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toBe('Expense_Claim_Form_John_Smith_2025_12_15.pdf');
  });

  test('sanitizes special characters in name', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'John O\'Brien' };
      if (id === 'expenseDate') return { value: '2025-12-15' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toBe('Expense_Claim_Form_John_O_Brien_2025_12_15.pdf');
  });

  test('uses Unknown for missing name', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return null;
      if (id === 'expenseDate') return { value: '2025-12-15' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toContain('Unknown');
  });

  test('uses Unknown for missing date', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'John' };
      if (id === 'expenseDate') return null;
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toContain('Unknown');
  });

  test('handles empty input values', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: '' };
      if (id === 'expenseDate') return { value: '' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toBe('Expense_Claim_Form_Unknown_Unknown.pdf');
  });
});

describe('getAttachmentsPdfFilename', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('generates attachments filename from form inputs', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'Jane Doe' };
      if (id === 'expenseDate') return { value: '2025-06-20' };
      return null;
    });

    const filename = getAttachmentsPdfFilename();

    expect(filename).toBe('Expense_Claim_Form_Attachments_Jane_Doe_2025_06_20.pdf');
  });

  test('uses Unknown for missing inputs', () => {
    globalThis.document.getElementById = mock(() => null);

    const filename = getAttachmentsPdfFilename();

    expect(filename).toBe('Expense_Claim_Form_Attachments_Unknown_Unknown.pdf');
  });
});

describe('isHtml2PdfAvailable', () => {
  test('returns true when html2pdf is defined', () => {
    globalThis.html2pdf = mock(() => {});

    expect(isHtml2PdfAvailable()).toBe(true);
  });

  test('returns false when html2pdf is undefined', () => {
    const original = globalThis.html2pdf;
    delete globalThis.html2pdf;

    expect(isHtml2PdfAvailable()).toBe(false);

    globalThis.html2pdf = original;
  });
});

describe('isJsPdfAvailable', () => {
  test('returns true when jspdf.jsPDF is defined', () => {
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };

    expect(isJsPdfAvailable()).toBe(true);
  });

  test('returns false when jspdf is undefined', () => {
    const original = globalThis.window.jspdf;
    delete globalThis.window.jspdf;

    expect(isJsPdfAvailable()).toBe(false);

    globalThis.window.jspdf = original;
  });

  test('returns false when jsPDF is missing from jspdf', () => {
    globalThis.window.jspdf = {};

    expect(isJsPdfAvailable()).toBe(false);
  });
});

describe('validatePdfLibraries', () => {
  test('does not throw when both libraries available', () => {
    globalThis.html2pdf = mock(() => {});
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };

    expect(() => validatePdfLibraries()).not.toThrow();
  });

  test('throws when html2pdf is missing', () => {
    const original = globalThis.html2pdf;
    delete globalThis.html2pdf;
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };

    expect(() => validatePdfLibraries()).toThrow('html2pdf library is not loaded');

    globalThis.html2pdf = original;
  });

  test('throws when jsPDF is missing', () => {
    globalThis.html2pdf = mock(() => {});
    const original = globalThis.window.jspdf;
    delete globalThis.window.jspdf;

    expect(() => validatePdfLibraries()).toThrow('jsPDF library is not loaded');

    globalThis.window.jspdf = original;
  });
});