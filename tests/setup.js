/**
 * Global Test Setup
 *
 * This file is preloaded before all tests run.
 * It sets up common mocks for browser globals that are needed
 * when testing browser-based JavaScript modules.
 */
import { mock, beforeAll, afterAll, spyOn } from 'bun:test';

// ============================================
// Lifecycle Hooks - Global Setup/Teardown
// ============================================

// Store original console methods for restoration
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// Suppress console output during tests (reduces noise)
// Set VERBOSE_TESTS=1 to see console output
const suppressConsole = process.env.VERBOSE_TESTS !== '1';

beforeAll(() => {
  if (suppressConsole) {
    console.log = mock(() => {});
    console.warn = mock(() => {});
    // Keep console.error for debugging test failures
    // console.error = mock(() => {});
    console.info = mock(() => {});
  }
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});

// ============================================
// Base64 Encoding (btoa/atob)
// ============================================
globalThis.btoa = (str) => Buffer.from(str).toString('base64');
globalThis.atob = (str) => Buffer.from(str, 'base64').toString();

// ============================================
// Fetch API Mock
// ============================================
export const mockFetch = mock(() => Promise.resolve({ ok: true }));
globalThis.fetch = mockFetch;

// ============================================
// Mock Response Factories
// ============================================

/**
 * Common mock response scenarios for fetch
 */
export const MockResponses = {
  /** Successful response with ok: true */
  success: () => Promise.resolve({ ok: true }),

  /** Successful response with JSON data */
  successWithData: (data) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),

  /** Failed response with ok: false */
  failure: (status = 400) => Promise.resolve({
    ok: false,
    status,
    statusText: status === 400 ? 'Bad Request' : 'Error',
  }),

  /** Network error (fetch rejects) */
  networkError: (message = 'Network error') => Promise.reject(new Error(message)),

  /** Timeout simulation */
  timeout: (ms = 5000) => new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  ),

  /** Sequential responses (for testing retry logic) */
  sequential: (responses) => {
    let index = 0;
    return () => {
      const response = responses[index] || responses[responses.length - 1];
      index++;
      return typeof response === 'function' ? response() : response;
    };
  },
};

// ============================================
// Window Object Mock
// ============================================
globalThis.window = {
  console: console,
  scrollTo: mock(() => {}),
  alert: mock(() => {}),
  confirm: mock(() => true),
};

// ============================================
// DOM Element Factory
// ============================================
export const createMockElement = (overrides = {}) => ({
  classList: {
    add: mock(() => {}),
    remove: mock(() => {}),
    contains: mock(() => false),
    toggle: mock(() => {}),
  },
  style: {},
  innerHTML: '',
  textContent: '',
  value: '',
  appendChild: mock(() => {}),
  removeChild: mock(() => {}),
  remove: mock(() => {}),
  addEventListener: mock(() => {}),
  removeEventListener: mock(() => {}),
  querySelector: mock(() => null),
  querySelectorAll: mock(() => []),
  getAttribute: mock(() => null),
  setAttribute: mock(() => {}),
  focus: mock(() => {}),
  blur: mock(() => {}),
  click: mock(() => {}),
  ...overrides,
});

// ============================================
// Document Object Mock
// ============================================
globalThis.document = {
  querySelectorAll: mock(() => []),
  querySelector: mock(() => createMockElement()),
  getElementById: mock(() => null),
  getElementsByClassName: mock(() => []),
  getElementsByTagName: mock(() => []),
  createElement: mock((tagName) => createMockElement({ tagName })),
  createTextNode: mock((text) => ({ textContent: text })),
  body: {
    innerHTML: '',
    classList: { add: mock(() => {}), remove: mock(() => {}) },
    appendChild: mock(() => {}),
    removeChild: mock(() => {}),
  },
  head: {
    appendChild: mock(() => {}),
  },
};

// ============================================
// PDF Generation Mocks
// ============================================

// html2canvas mock
globalThis.html2canvas = mock(() => Promise.resolve({
  toDataURL: () => 'data:image/png;base64,mockImageData',
  width: 800,
  height: 600,
}));

// jsPDF mock
globalThis.jspdf = {
  jsPDF: mock(function() {
    return {
      addImage: mock(() => {}),
      save: mock(() => {}),
      output: mock(() => 'mockPdfData'),
      internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 },
      },
    };
  }),
};

// html2pdf mock (chainable API)
const createHtml2PdfInstance = () => {
  const instance = {
    set: mock(function() { return instance; }),
    from: mock(function() { return instance; }),
    save: mock(function() { return Promise.resolve(); }),
    toPdf: mock(function() { return instance; }),
    get: mock(function() { return instance; }),
    outputPdf: mock(() => Promise.resolve('data:application/pdf;base64,mockPdfBase64Data')),
  };
  return instance;
};
globalThis.html2pdf = mock(() => createHtml2PdfInstance());

// ============================================
// Test Utilities
// ============================================

/**
 * Reset all global mocks to their initial state
 * Call this in beforeEach() when needed
 */
export function resetAllMocks() {
  mockFetch.mockClear();
  mockFetch.mockImplementation(MockResponses.success);

  globalThis.document.querySelectorAll.mockClear();
  globalThis.document.querySelector.mockClear();
  globalThis.document.getElementById.mockClear();
  globalThis.document.createElement.mockClear();

  globalThis.html2canvas.mockClear();
  globalThis.html2pdf.mockClear();
}

/**
 * Configure fetch mock with a specific response
 * @param {Function} responseFactory - One of MockResponses or custom function
 */
export function setFetchResponse(responseFactory) {
  mockFetch.mockImplementation(responseFactory);
}

/**
 * Create a mock form with specified field values
 * @param {Object} fields - Object mapping field names to values
 * @returns {Object} Mock form object
 */
export function createMockForm(fields = {}) {
  const form = {
    elements: [],
    querySelectorAll: mock(() => []),
    querySelector: mock(() => null),
    reset: mock(() => {}),
    submit: mock(() => {}),
  };
  for (const [name, value] of Object.entries(fields)) {
    const field = {
      value: String(value),
      name,
      tagName: 'INPUT',
      disabled: false,
      setAttribute: mock(() => {}),
      removeAttribute: mock(() => {}),
    };
    form[name] = field;
    form.elements.push(field);
  }
  return form;
}

/**
 * Create a mock event with preventDefault
 * @param {Object} target - The event target (e.g., form)
 * @returns {Object} Mock event object
 */
export function createMockEvent(target = {}) {
  return {
    preventDefault: mock(() => {}),
    stopPropagation: mock(() => {}),
    target,
  };
}

/**
 * Wait for all pending promises to resolve
 * Useful for testing async code
 */
export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Assert that a mock was called with specific arguments
 * @param {Mock} mockFn - The mock function
 * @param {Array} expectedArgs - Expected arguments
 * @param {number} callIndex - Which call to check (default: 0)
 */
export function assertCalledWith(mockFn, expectedArgs, callIndex = 0) {
  const call = mockFn.mock.calls[callIndex];
  if (!call) {
    throw new Error(`Mock was not called at index ${callIndex}`);
  }
  expectedArgs.forEach((arg, i) => {
    if (JSON.stringify(call[i]) !== JSON.stringify(arg)) {
      throw new Error(`Argument ${i} mismatch: expected ${JSON.stringify(arg)}, got ${JSON.stringify(call[i])}`);
    }
  });
}

/**
 * Get the JSON body from a fetch call
 * @param {number} callIndex - Which call to check (default: 0)
 * @returns {Object} Parsed JSON body
 */
export function getFetchBody(callIndex = 0) {
  const call = mockFetch.mock.calls[callIndex];
  if (!call || !call[1]?.body) {
    throw new Error(`No fetch body found at call index ${callIndex}`);
  }
  return JSON.parse(call[1].body);
}

/**
 * Get the URL from a fetch call
 * @param {number} callIndex - Which call to check (default: 0)
 * @returns {string} The URL
 */
export function getFetchUrl(callIndex = 0) {
  const call = mockFetch.mock.calls[callIndex];
  if (!call) {
    throw new Error(`No fetch call found at index ${callIndex}`);
  }
  return call[0];
}

// Re-export spyOn for convenience
export { spyOn };
