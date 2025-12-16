/**
 * Form Handler Integration Tests
 *
 * These tests require comprehensive DOM mocking since the form-handler
 * interacts with PDF generation and UI handlers.
 */
import { describe, expect, test, mock, beforeEach } from 'bun:test';

// Mock browser globals before importing modules
const mockFetch = mock(() => Promise.resolve({ ok: true }));
globalThis.fetch = mockFetch;

// Mock btoa/atob for base64 encoding
globalThis.btoa = (str) => Buffer.from(str).toString('base64');
globalThis.atob = (str) => Buffer.from(str, 'base64').toString();

globalThis.window = {
  console: console,
  scrollTo: mock(() => {}),
};

// Create a mock element factory
const createMockElement = () => ({
  classList: { add: mock(() => {}), remove: mock(() => {}) },
  style: {},
  innerHTML: '',
  textContent: '',
  appendChild: mock(() => {}),
  remove: mock(() => {}),
});

globalThis.document = {
  querySelectorAll: mock(() => []),
  querySelector: mock(() => createMockElement()),
  getElementById: mock(() => null),
  createElement: mock(() => createMockElement()),
  body: {
    innerHTML: '',
    classList: { add: mock(() => {}), remove: mock(() => {}) },
    appendChild: mock(() => {}),
  },
};

// Mock html2canvas (used by pdf-generator)
globalThis.html2canvas = mock(() => Promise.resolve({
  toDataURL: () => 'data:image/png;base64,mockImageData'
}));

// Mock jspdf
globalThis.jspdf = {
  jsPDF: mock(function() {
    return {
      addImage: mock(() => {}),
      save: mock(() => {}),
      output: mock(() => 'mockPdfData'),
    };
  })
};

// Mock html2pdf (chainable API used in pdf-generator)
const mockHtml2PdfInstance = {
  set: mock(function() { return this; }),
  from: mock(function() { return this; }),
  outputPdf: mock(() => Promise.resolve('data:application/pdf;base64,mockPdfBase64Data')),
};
globalThis.html2pdf = mock(() => mockHtml2PdfInstance);

// Import the module under test
import { handleFormSubmit, submitBulk, submitIndividualItems } from '../form-handler.js';

describe('submitBulk', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => Promise.resolve({ ok: true }));
  });

  test('returns true on successful submission', async () => {
    const expenseItems = [];
    const vehicleData = { kms: 0, amount: 0, comment: '' };
    const formData = { fullName: 'Test', employeeId: 'E1', expenseDate: '2025-12-15' };
    const result = await submitBulk(expenseItems, vehicleData, formData, 'https://api.test.com', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    expect(result).toBe(true);
  });

  test('returns false when fetch fails', async () => {
    mockFetch.mockImplementation(() => Promise.resolve({ ok: false }));
    const result = await submitBulk([], { kms: 0, amount: 0, comment: '' }, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    expect(result).toBe(false);
  });

  test('returns false on network error', async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error('Network')));
    const result = await submitBulk([], { kms: 0, amount: 0, comment: '' }, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    expect(result).toBe(false);
  });

  test('sends POST request with correct URL', async () => {
    await submitBulk([], { kms: 0, amount: 0, comment: '' }, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://my-api.com/submit', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    expect(mockFetch.mock.calls[0][0]).toBe('https://my-api.com/submit');
  });

  test('base64 encodes lineItems when stringify enabled', async () => {
    const items = [{ type: 'Flights', amount: 250, description: '', accountCode: '480' }];
    await submitBulk(items, { kms: 0, amount: 0, comment: '' }, { fullName: 'J', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true });
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(typeof payload.lineItems).toBe('string');
  });
});

describe('submitIndividualItems', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => Promise.resolve({ ok: true }));
  });

  test('returns false when no items have amount', async () => {
    const items = [{ type: 'Flights', amount: 0, accountCode: '480' }];
    const result = await submitIndividualItems(items, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com');
    expect(result).toBe(false);
  });

  test('submits only items with amount > 0', async () => {
    const items = [
      { type: 'Flights', amount: 250, accountCode: '480' },
      { type: 'Meals', amount: 0, accountCode: '484' },
      { type: 'Parking', amount: 25, accountCode: '482' }
    ];
    await submitIndividualItems(items, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('returns false if any submission fails', async () => {
    let count = 0;
    mockFetch.mockImplementation(() => { count++; return Promise.resolve({ ok: count !== 2 }); });
    const items = [{ type: 'A', amount: 100, accountCode: '1' }, { type: 'B', amount: 50, accountCode: '2' }];
    const result = await submitIndividualItems(items, { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' }, 'https://api.test.com');
    expect(result).toBe(false);
  });
});

describe('handleFormSubmit', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => Promise.resolve({ ok: true }));
    globalThis.document.querySelectorAll = mock(() => []);
  });

  test('calls preventDefault', async () => {
    const mockPreventDefault = mock(() => {});
    const mockEvent = {
      preventDefault: mockPreventDefault,
      target: { fullName: { value: 'T' }, employeeId: { value: 'E' }, expenseDate: { value: '2025-12-15' }, kms: { value: '0' }, rate: { value: '1' }, vehicleAmount: { value: '0' }, vehicleComment: { value: '' } }
    };
    await handleFormSubmit(mockEvent, { API_URL: 'https://api.test.com', SUBMIT_INDIVIDUAL_LINE_ITEMS: false });
    expect(mockPreventDefault).toHaveBeenCalled();
  });

  test('uses API_URL from config', async () => {
    const mockEvent = {
      preventDefault: mock(() => {}),
      target: { fullName: { value: 'T' }, employeeId: { value: 'E' }, expenseDate: { value: '2025-12-15' }, kms: { value: '0' }, rate: { value: '1' }, vehicleAmount: { value: '0' }, vehicleComment: { value: '' } }
    };
    await handleFormSubmit(mockEvent, { API_URL: 'https://custom.api.com/submit', SUBMIT_INDIVIDUAL_LINE_ITEMS: false, STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    expect(mockFetch.mock.calls[0][0]).toBe('https://custom.api.com/submit');
  });

  test('collects form data', async () => {
    const mockEvent = {
      preventDefault: mock(() => {}),
      target: { fullName: { value: 'Jane Doe' }, employeeId: { value: 'EMP999' }, expenseDate: { value: '2025-06-15' }, kms: { value: '0' }, rate: { value: '1' }, vehicleAmount: { value: '0' }, vehicleComment: { value: '' } }
    };
    await handleFormSubmit(mockEvent, { API_URL: 'https://api.test.com', SUBMIT_INDIVIDUAL_LINE_ITEMS: false, STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(payload.fullName).toBe('Jane Doe');
    expect(payload.employeeId).toBe('EMP999');
  });
});