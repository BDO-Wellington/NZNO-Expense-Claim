/**
 * PDF Generator Module Tests
 */
import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { createMockElement, resetAllMocks } from '../../../tests/setup.js';
import {
  getDynamicPdfFilename,
  getAttachmentsPdfFilename,
  isHtml2PdfAvailable,
  isJsPdfAvailable,
  isPdfLibAvailable,
  validatePdfLibraries,
} from '../pdf-generator.js';

// Store originals to restore after tests
const originalGetElementById = globalThis.document.getElementById;
const originalHtml2pdf = globalThis.html2pdf;
const originalWindowJspdf = globalThis.window?.jspdf;

describe('getDynamicPdfFilename', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    // Restore original getElementById
    globalThis.document.getElementById = originalGetElementById;
  });

  test('generates filename from form inputs', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'John Smith' };
      if (id === 'expenseDate') return { value: '2025-12-15' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toBe('1_Expense_Claim_Summary_John_Smith_2025_12_15.pdf');
  });

  test('sanitizes special characters in name', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'John O\'Brien' };
      if (id === 'expenseDate') return { value: '2025-12-15' };
      return null;
    });

    const filename = getDynamicPdfFilename();

    expect(filename).toBe('1_Expense_Claim_Summary_John_O_Brien_2025_12_15.pdf');
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

    expect(filename).toBe('1_Expense_Claim_Summary_Unknown_Unknown.pdf');
  });
});

describe('getAttachmentsPdfFilename', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('generates attachments filename from form inputs', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'Jane Doe' };
      if (id === 'expenseDate') return { value: '2025-06-20' };
      return null;
    });

    const filename = getAttachmentsPdfFilename();

    expect(filename).toBe('2_Expense_Claim_Receipts_Jane_Doe_2025_06_20.pdf');
  });

  test('uses Unknown for missing inputs', () => {
    globalThis.document.getElementById = mock(() => null);

    const filename = getAttachmentsPdfFilename();

    expect(filename).toBe('2_Expense_Claim_Receipts_Unknown_Unknown.pdf');
  });

  test('summary filename sorts before attachments filename alphabetically', () => {
    globalThis.document.getElementById = mock((id) => {
      if (id === 'fullName') return { value: 'Test User' };
      if (id === 'expenseDate') return { value: '2025-01-01' };
      return null;
    });

    const summaryFilename = getDynamicPdfFilename();
    const attachmentsFilename = getAttachmentsPdfFilename();

    // Verify alphabetical ordering: summary (1_) comes before attachments (2_)
    expect(summaryFilename < attachmentsFilename).toBe(true);
    expect(summaryFilename.startsWith('1_')).toBe(true);
    expect(attachmentsFilename.startsWith('2_')).toBe(true);
  });
});

describe('isHtml2PdfAvailable', () => {
  afterEach(() => {
    globalThis.html2pdf = originalHtml2pdf;
  });

  test('returns true when html2pdf is defined', () => {
    globalThis.html2pdf = mock(() => {});

    expect(isHtml2PdfAvailable()).toBe(true);
  });

  test('returns false when html2pdf is undefined', () => {
    delete globalThis.html2pdf;

    expect(isHtml2PdfAvailable()).toBe(false);
  });
});

describe('isJsPdfAvailable', () => {
  afterEach(() => {
    if (originalWindowJspdf) {
      globalThis.window.jspdf = originalWindowJspdf;
    }
  });

  test('returns true when jspdf.jsPDF is defined', () => {
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };

    expect(isJsPdfAvailable()).toBe(true);
  });

  test('returns false when jspdf is undefined', () => {
    delete globalThis.window.jspdf;

    expect(isJsPdfAvailable()).toBe(false);
  });

  test('returns false when jsPDF is missing from jspdf', () => {
    globalThis.window.jspdf = {};

    expect(isJsPdfAvailable()).toBe(false);
  });
});

describe('isPdfLibAvailable', () => {
  const originalPDFLib = globalThis.window?.PDFLib;

  afterEach(() => {
    if (originalPDFLib) {
      globalThis.window.PDFLib = originalPDFLib;
    } else {
      delete globalThis.window.PDFLib;
    }
  });

  test('returns true when pdf-lib is available', () => {
    globalThis.window.PDFLib = { PDFDocument: mock(() => {}) };

    expect(isPdfLibAvailable()).toBe(true);
  });

  test('returns false when PDFLib is undefined', () => {
    delete globalThis.window.PDFLib;

    expect(isPdfLibAvailable()).toBe(false);
  });

  test('returns false when PDFDocument is missing from PDFLib', () => {
    globalThis.window.PDFLib = {};

    expect(isPdfLibAvailable()).toBe(false);
  });
});

describe('validatePdfLibraries', () => {
  const originalPDFLib = globalThis.window?.PDFLib;

  afterEach(() => {
    globalThis.html2pdf = originalHtml2pdf;
    if (originalWindowJspdf) {
      globalThis.window.jspdf = originalWindowJspdf;
    }
    if (originalPDFLib) {
      globalThis.window.PDFLib = originalPDFLib;
    } else {
      delete globalThis.window.PDFLib;
    }
  });

  test('does not throw when all libraries available', () => {
    globalThis.html2pdf = mock(() => {});
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };
    globalThis.window.PDFLib = { PDFDocument: mock(() => {}) };

    expect(() => validatePdfLibraries()).not.toThrow();
  });

  test('throws when html2pdf is missing', () => {
    delete globalThis.html2pdf;
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };
    globalThis.window.PDFLib = { PDFDocument: mock(() => {}) };

    expect(() => validatePdfLibraries()).toThrow('html2pdf library is not loaded');
  });

  test('throws when jsPDF is missing', () => {
    globalThis.html2pdf = mock(() => {});
    delete globalThis.window.jspdf;
    globalThis.window.PDFLib = { PDFDocument: mock(() => {}) };

    expect(() => validatePdfLibraries()).toThrow('jsPDF library is not loaded');
  });

  test('throws when pdf-lib is missing', () => {
    globalThis.html2pdf = mock(() => {});
    globalThis.window.jspdf = { jsPDF: mock(() => {}) };
    delete globalThis.window.PDFLib;

    expect(() => validatePdfLibraries()).toThrow('pdf-lib library is not loaded');
  });
});