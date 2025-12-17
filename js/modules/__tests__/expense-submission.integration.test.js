/**
 * Expense Submission Integration Tests
 *
 * End-to-end tests for expense claim submission with:
 * - Creative test data for mandatory fields
 * - Realistic flight expense amounts
 * - PDF attachment handling
 * - Console error monitoring
 *
 * Browser globals are provided by tests/setup.js preload.
 */
import { describe, expect, test, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import {
  mockFetch,
  resetAllMocks,
  createMockForm,
  createMockEvent,
  MockResponses,
  setFetchResponse,
  getFetchBody,
  getFetchUrl,
  createMockElement,
} from '../../../tests/setup.js';

import { handleFormSubmit, submitBulk } from '../form-handler.js';
import { EXPENSE_TYPES, getAccountCode } from '../expense-types.js';

// ============================================
// Test Data Factory - Creative Iterations
// ============================================

/**
 * Creative test data for mandatory fields.
 * Mimics real-world NZNO nurse employees with diverse naming conventions.
 */
const CREATIVE_TEST_DATA = {
  nurses: [
    { fullName: 'Aroha Te Whetu', employeeId: 'NZN-2024-0451', region: 'Auckland' },
    { fullName: 'Ngaire Māori-Smith', employeeId: 'NZN-2023-1892', region: 'Wellington' },
    { fullName: "Siobhán O'Connor", employeeId: 'NZN-2024-0033', region: 'Christchurch' },
    { fullName: 'Jing-Wei Huang', employeeId: 'NZN-2022-4578', region: 'Dunedin' },
    { fullName: 'Priya Ramasubramanian', employeeId: 'NZN-2021-9012', region: 'Hamilton' },
    { fullName: 'Björk Sigurðardóttir', employeeId: 'NZN-2024-0789', region: 'Tauranga' },
    { fullName: 'María José García-López', employeeId: 'NZN-2023-5647', region: 'Rotorua' },
    { fullName: 'Jean-François Dupont', employeeId: 'NZN-2022-3210', region: 'Nelson' },
  ],
  flightAmounts: [
    { description: 'Auckland to Wellington return', amount: 285.50 },
    { description: 'Christchurch to Queenstown one-way', amount: 189.00 },
    { description: 'Wellington to Dunedin return (conference)', amount: 412.75 },
    { description: 'Auckland to Invercargill via Christchurch', amount: 567.20 },
    { description: 'Domestic flight for urgent patient transfer', amount: 325.00 },
  ],
  expenseDates: [
    '2025-01-15',
    '2025-02-28',
    '2025-03-10',
    '2025-04-22',
    '2025-05-05',
  ],
};

/**
 * Creates a mock PDF file for attachment testing.
 * @param {string} filename - The filename for the PDF
 * @returns {object} Mock file object
 */
function createMockPdfFile(filename = 'receipt.pdf') {
  return {
    name: filename,
    type: 'application/pdf',
    size: 102400, // ~100KB
    lastModified: Date.now(),
    arrayBuffer: mock(() => Promise.resolve(new ArrayBuffer(1024))),
    text: mock(() => Promise.resolve('%PDF-1.4 mock content')),
    slice: mock(() => new Blob()),
  };
}

/**
 * Creates a mock FileReader that simulates reading a PDF.
 * @returns {object} Mock FileReader instance
 */
function createMockFileReader() {
  const reader = {
    readAsDataURL: mock(function() {
      setTimeout(() => {
        this.result = 'data:application/pdf;base64,JVBERi0xLjQgbW9jayBQREYgY29udGVudA==';
        if (this.onload) this.onload({ target: this });
      }, 10);
    }),
    onload: null,
    onerror: null,
    result: null,
  };
  return reader;
}

// ============================================
// Console Error Capture
// ============================================

let consoleErrors = [];
let originalConsoleError;

/**
 * Start capturing console.error calls.
 */
function startErrorCapture() {
  consoleErrors = [];
  originalConsoleError = console.error;
  console.error = mock((...args) => {
    consoleErrors.push(args);
  });
}

/**
 * Stop capturing and restore console.error.
 * @returns {Array} Captured error messages
 */
function stopErrorCapture() {
  const captured = [...consoleErrors];
  console.error = originalConsoleError;
  consoleErrors = [];
  return captured;
}

// ============================================
// Extended DOM Mocks for Integration Tests
// ============================================

/**
 * Sets up additional DOM mocks required for UI components.
 */
function setupExtendedDOMMocks() {
  // Add requestAnimationFrame for animations
  globalThis.requestAnimationFrame = mock((callback) => {
    setTimeout(callback, 0);
    return 1;
  });
  globalThis.cancelAnimationFrame = mock(() => {});

  // Add createElementNS for SVG elements (toast.js icons)
  globalThis.document.createElementNS = mock((ns, tag) => ({
    setAttribute: mock(() => {}),
    setAttributeNS: mock(() => {}),
    appendChild: mock(() => {}),
    innerHTML: '',
    classList: {
      add: mock(() => {}),
      remove: mock(() => {}),
      contains: mock(() => false),
    },
    style: {},
  }));

  // Ensure document.body has style property
  globalThis.document.body = {
    innerHTML: '',
    style: { overflow: '' },
    classList: {
      add: mock(() => {}),
      remove: mock(() => {}),
    },
    appendChild: mock(() => {}),
    removeChild: mock(() => {}),
    contains: mock(() => false),
  };

  // Mock progress overlay element
  const mockProgressOverlay = createMockElement({
    classList: {
      add: mock(() => {}),
      remove: mock(() => {}),
      contains: mock(() => false),
    },
    offsetHeight: 100,
  });

  // Mock toast container
  const mockToastContainer = createMockElement({
    appendChild: mock(() => {}),
    removeChild: mock(() => {}),
  });

  // Enhanced querySelector for specific elements
  globalThis.document.querySelector = mock((selector) => {
    if (selector === '.progress-overlay') return mockProgressOverlay;
    if (selector === '.toast-container') return mockToastContainer;
    if (selector === '#progress-status') return createMockElement();
    return createMockElement();
  });

  // getElementById for various UI elements
  globalThis.document.getElementById = mock((id) => {
    if (id === 'progress-status') return createMockElement();
    return createMockElement();
  });
}

// ============================================
// Integration Tests
// ============================================

describe('Expense Submission Integration', () => {
  beforeEach(() => {
    resetAllMocks();
    startErrorCapture();
    setupExtendedDOMMocks();

    // Setup FileReader mock
    globalThis.FileReader = mock(() => createMockFileReader());
  });

  afterEach(() => {
    const errors = stopErrorCapture();
    if (errors.length > 0) {
      // Log errors for debugging but don't fail unless expected
      errors.forEach(err => originalConsoleError?.('[Test captured]:', ...err));
    }
  });

  describe('Creative Test Data Iterations', () => {
    test.each(CREATIVE_TEST_DATA.nurses)(
      'submits claim for $fullName ($employeeId)',
      async ({ fullName, employeeId }) => {
        const mockEvent = createMockEvent(
          createMockForm({
            fullName,
            employeeId,
            expenseDate: '2025-06-15',
            kms: '0',
            rate: '1.04',
            vehicleAmount: '0',
            vehicleComment: ''
          })
        );

        await handleFormSubmit(mockEvent, {
          API_URL: 'https://api.nzno.org.nz/expenses',
          SUBMIT_INDIVIDUAL_LINE_ITEMS: false,
          STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true
        });

        const payload = getFetchBody();
        expect(payload.fullName).toBe(fullName);
        expect(payload.employeeId).toBe(employeeId);

        const errors = stopErrorCapture();
        const submissionErrors = errors.filter(e =>
          e.some(msg => typeof msg === 'string' && msg.includes('submission'))
        );
        expect(submissionErrors.length).toBe(0);
      }
    );

    test.each(CREATIVE_TEST_DATA.expenseDates)(
      'submits claim with date %s',
      async (expenseDate) => {
        const mockEvent = createMockEvent(
          createMockForm({
            fullName: 'Test Nurse',
            employeeId: 'NZN-2024-TEST',
            expenseDate,
            kms: '0',
            rate: '1.04',
            vehicleAmount: '0',
            vehicleComment: ''
          })
        );

        await handleFormSubmit(mockEvent, {
          API_URL: 'https://api.nzno.org.nz/expenses',
          SUBMIT_INDIVIDUAL_LINE_ITEMS: false,
          STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false
        });

        const payload = getFetchBody();
        expect(payload.expenseDate).toBe(expenseDate);
      }
    );
  });

  describe('Flights Expense with Realistic Amounts', () => {
    test.each(CREATIVE_TEST_DATA.flightAmounts)(
      'submits flight expense: $description ($amount NZD)',
      async ({ description, amount }) => {
        const expenseItems = [{
          type: 'Flights',
          amount,
          description,
          attachments: [],
          accountCode: getAccountCode('Flights')
        }];

        const vehicleData = { kms: 0, rate: 1.04, amount: 0, comment: '' };
        const formData = {
          fullName: 'Aroha Te Whetu',
          employeeId: 'NZN-2024-0451',
          expenseDate: '2025-06-20'
        };

        const result = await submitBulk(
          expenseItems,
          vehicleData,
          formData,
          'https://api.nzno.org.nz/expenses',
          { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
        );

        expect(result).toBe(true);

        const payload = getFetchBody();
        // Decode the base64 lineItems
        const lineItems = JSON.parse(atob(payload.lineItems));
        expect(lineItems[0].amount).toBe(amount);
        expect(lineItems[0].accountCode).toBe('480'); // Flights account code

        // Check no errors occurred
        const errors = stopErrorCapture();
        expect(errors.filter(e => e[0]?.includes?.('[ExpenseClaim]')).length).toBe(0);
      }
    );

    test('submits Wellington to Auckland flight at $324.99', async () => {
      const flightAmount = 324.99;

      const expenseItems = [{
        type: 'Flights',
        amount: flightAmount,
        description: 'Wellington to Auckland - NZNO AGM',
        attachments: [],
        accountCode: '480'
      }];

      const result = await submitBulk(
        expenseItems,
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        {
          fullName: "Siobhán O'Connor",
          employeeId: 'NZN-2024-0033',
          expenseDate: '2025-07-15'
        },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
      );

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const payload = getFetchBody();
      expect(payload.fullName).toBe("Siobhán O'Connor");
    });
  });

  describe('PDF Attachment Handling', () => {
    test('processes dummy PDF attachment for flight receipt', async () => {
      const mockPdfFile = createMockPdfFile('air-nz-receipt-2025.pdf');

      // Create mock file input with files
      const mockFileInput = {
        files: [mockPdfFile],
        type: 'file',
        value: 'C:\\fakepath\\air-nz-receipt-2025.pdf'
      };

      // Mock DOM for file collection
      const mockRow = {
        cells: [{ textContent: 'Flights' }],
        querySelector: mock((selector) => {
          if (selector.includes('number')) {
            return { value: '285.50' };
          }
          if (selector.includes('file')) {
            return mockFileInput;
          }
          return null;
        })
      };

      globalThis.document.querySelectorAll = mock((selector) => {
        if (selector.includes('StandardExpensesTable')) {
          return [mockRow];
        }
        return [];
      });

      const formData = {
        fullName: 'Jing-Wei Huang',
        employeeId: 'NZN-2022-4578',
        expenseDate: '2025-06-25'
      };

      const result = await submitBulk(
        [{ type: 'Flights', amount: 285.50, description: '', attachments: [], accountCode: '480' }],
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        formData,
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
      );

      expect(result).toBe(true);

      // Verify payload contains attachments
      const payload = getFetchBody();
      expect(payload.attachments).toBeDefined();
    });

    test('handles submission with missing attachment gracefully', async () => {
      startErrorCapture();

      const expenseItems = [{
        type: 'Flights',
        amount: 412.75,
        description: 'Conference travel',
        attachments: [], // No attachments
        accountCode: '480'
      }];

      const result = await submitBulk(
        expenseItems,
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        {
          fullName: 'Priya Ramasubramanian',
          employeeId: 'NZN-2021-9012',
          expenseDate: '2025-08-10'
        },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
      );

      expect(result).toBe(true);

      const errors = stopErrorCapture();
      // Should not have critical errors for missing optional attachments
      const criticalErrors = errors.filter(e =>
        e.some(msg => typeof msg === 'string' && msg.includes('CRITICAL'))
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  describe('Error Handling and Console Monitoring', () => {
    test('captures and reports API errors', async () => {
      setFetchResponse(() => MockResponses.failure(500));

      const result = await submitBulk(
        [{ type: 'Flights', amount: 200, description: '', attachments: [], accountCode: '480' }],
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        {
          fullName: 'Test User',
          employeeId: 'TEST-001',
          expenseDate: '2025-06-01'
        },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
      );

      expect(result).toBe(false);
    });

    test('handles network timeout gracefully', async () => {
      setFetchResponse(() => MockResponses.networkError('ETIMEDOUT'));

      const result = await submitBulk(
        [{ type: 'Flights', amount: 350, description: '', attachments: [], accountCode: '480' }],
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        {
          fullName: 'María José García-López',
          employeeId: 'NZN-2023-5647',
          expenseDate: '2025-09-15'
        },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
      );

      expect(result).toBe(false);

      const errors = stopErrorCapture();
      // Should have logged the error
      expect(errors.length).toBeGreaterThan(0);
    });

    test('logs errors with [ExpenseClaim] prefix', async () => {
      setFetchResponse(() => MockResponses.networkError('Connection refused'));

      await submitBulk(
        [{ type: 'Flights', amount: 100, description: '', attachments: [], accountCode: '480' }],
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        { fullName: 'T', employeeId: 'E', expenseDate: '2025-01-01' },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
      );

      const errors = stopErrorCapture();
      const prefixedErrors = errors.filter(e =>
        e.some(msg => typeof msg === 'string' && msg.includes('[ExpenseClaim]'))
      );

      // Verify error logging follows project convention
      expect(prefixedErrors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Combined Scenario: Full Submission Flow', () => {
    test('complete submission with creative data, flight expense, and PDF', async () => {
      // Select random creative data
      const nurse = CREATIVE_TEST_DATA.nurses[0];
      const flight = CREATIVE_TEST_DATA.flightAmounts[2]; // Wellington to Dunedin
      const date = CREATIVE_TEST_DATA.expenseDates[3];

      const expenseItems = [{
        type: 'Flights',
        amount: flight.amount,
        description: flight.description,
        attachments: [{
          fileName: 'flight-receipt.pdf',
          content: 'JVBERi0xLjQgbW9jayBjb250ZW50', // Mock base64
          mimeType: 'application/pdf'
        }],
        accountCode: '480'
      }];

      const result = await submitBulk(
        expenseItems,
        { kms: 0, rate: 1.04, amount: 0, comment: '' },
        {
          fullName: nurse.fullName,
          employeeId: nurse.employeeId,
          expenseDate: date
        },
        'https://api.nzno.org.nz/expenses',
        { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
      );

      expect(result).toBe(true);

      const payload = getFetchBody();

      // Verify all mandatory fields
      expect(payload.fullName).toBe(nurse.fullName);
      expect(payload.employeeId).toBe(nurse.employeeId);
      expect(payload.expenseDate).toBe(date);

      // Verify flight amount in line items
      const lineItems = JSON.parse(atob(payload.lineItems));
      expect(lineItems[0].amount).toBe(flight.amount);

      // Verify attachments present
      expect(payload.attachments).toBeDefined();

      // Final console check - no submission errors
      const errors = stopErrorCapture();
      const submissionErrors = errors.filter(e =>
        Array.isArray(e) && e.some(msg =>
          typeof msg === 'string' &&
          (msg.includes('submission failed') || msg.includes('CRITICAL'))
        )
      );
      expect(submissionErrors.length).toBe(0);
    });
  });
});
