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
// Animation Frame Mocks
// ============================================
globalThis.requestAnimationFrame = mock((callback) => {
  setTimeout(callback, 0);
  return 1;
});
globalThis.cancelAnimationFrame = mock(() => {});

// ============================================
// DOM Element Factory - Realistic DOM Simulation
// ============================================

/**
 * Creates a mock DOM element that simulates real DOM behavior.
 * Elements track their children, attributes, classes, and can be queried.
 */
export const createMockElement = (overrides = {}) => {
  const children = [];
  const attributes = {};
  const classes = new Set();
  const eventListeners = {};
  let _className = '';
  let _textContent = '';
  let _innerHTML = '';
  let _id = '';

  const element = {
    tagName: overrides.tagName || 'DIV',
    namespaceURI: overrides.namespaceURI || null,
    children,
    childNodes: children,
    parentNode: null,
    style: {},
    value: '',

    // Getter/setter for id
    get id() {
      return _id;
    },
    set id(value) {
      _id = value;
    },

    // Getter/setter for className to sync with classList
    get className() {
      return _className;
    },
    set className(value) {
      _className = value;
      classes.clear();
      value.split(' ').filter(Boolean).forEach(c => classes.add(c));
    },

    // Getter/setter for textContent
    get textContent() {
      return _textContent;
    },
    set textContent(value) {
      _textContent = value;
    },

    // Getter/setter for innerHTML (always returns string)
    get innerHTML() {
      return _innerHTML;
    },
    set innerHTML(value) {
      _innerHTML = String(value);
      // Clear children when innerHTML is set to empty
      if (value === '') {
        children.length = 0;
      }
    },

    classList: {
      add: (...classNames) => classNames.forEach(c => classes.add(c)),
      remove: (...classNames) => classNames.forEach(c => classes.delete(c)),
      contains: (className) => classes.has(className),
      toggle: (className) => {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        } else {
          classes.add(className);
          return true;
        }
      },
    },

    appendChild: (child) => {
      if (child && typeof child === 'object') {
        child.parentNode = element;
        children.push(child);
      }
      return child;
    },

    removeChild: (child) => {
      const index = children.indexOf(child);
      if (index > -1) {
        children.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    },

    remove: function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    },

    addEventListener: (event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    },

    removeEventListener: (event, handler) => {
      if (eventListeners[event]) {
        const idx = eventListeners[event].indexOf(handler);
        if (idx > -1) eventListeners[event].splice(idx, 1);
      }
    },

    dispatchEvent: (event) => {
      const handlers = eventListeners[event.type] || [];
      handlers.forEach(h => h(event));
    },

    querySelector: (selector) => {
      return queryElement(element, selector);
    },

    querySelectorAll: (selector) => {
      return queryAllElements(element, selector);
    },

    getAttribute: (name) => attributes[name] || null,

    setAttribute: (name, value) => {
      attributes[name] = String(value);
      if (name === 'id') element.id = value;
      if (name === 'class') {
        element.className = value;
        value.split(' ').filter(Boolean).forEach(c => classes.add(c));
      }
    },

    setAttributeNS: (ns, name, value) => {
      attributes[name] = String(value);
    },

    focus: mock(() => {}),
    blur: mock(() => {}),
    click: function() {
      const handlers = eventListeners['click'] || [];
      handlers.forEach(h => h({ target: this, preventDefault: () => {} }));
    },

    ...overrides,
  };

  // Apply initial id if provided
  if (overrides.id) {
    element.id = overrides.id;
    attributes.id = overrides.id;
  }

  return element;
};

/**
 * Query helper - finds first matching element
 */
function queryElement(root, selector) {
  const results = queryAllElements(root, selector);
  return results[0] || null;
}

/**
 * Query helper - finds all matching elements (simplified selector support)
 */
function queryAllElements(root, selector) {
  const results = [];

  function traverse(el) {
    if (!el || !el.children) return;

    for (const child of el.children) {
      if (matchesSelector(child, selector)) {
        results.push(child);
      }
      traverse(child);
    }
  }

  traverse(root);
  return results;
}

/**
 * Simple selector matching (supports #id, .class, tagname, tag.class)
 */
function matchesSelector(el, selector) {
  if (!el) return false;

  // ID selector
  if (selector.startsWith('#')) {
    return el.id === selector.slice(1);
  }

  // Compound selector (tag.class)
  if (selector.includes('.') && !selector.startsWith('.')) {
    const [tag, ...classes] = selector.split('.');
    const tagMatches = el.tagName && el.tagName.toLowerCase() === tag.toLowerCase();
    const classesMatch = classes.every(c => el.classList && el.classList.contains(c));
    return tagMatches && classesMatch;
  }

  // Class selector
  if (selector.startsWith('.')) {
    const className = selector.slice(1);
    return el.classList && el.classList.contains(className);
  }

  // Tag selector
  if (el.tagName && el.tagName.toLowerCase() === selector.toLowerCase()) {
    return true;
  }

  // Attribute selector like [role="alert"]
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const match = selector.slice(1, -1).match(/(\w+)(?:="([^"]*)")?/);
    if (match) {
      const [, attr, value] = match;
      const attrValue = el.getAttribute ? el.getAttribute(attr) : null;
      return value !== undefined ? attrValue === value : attrValue !== null;
    }
  }

  return false;
}

// ============================================
// Document Object Mock - Realistic DOM
// ============================================

// Create the document body as a proper mock element
const mockBody = createMockElement({ tagName: 'BODY' });
mockBody.style = { overflow: '' };

// Add innerHTML setter to body that clears children
Object.defineProperty(mockBody, 'innerHTML', {
  get() { return ''; },
  set(value) {
    // Clear all children when innerHTML is set
    mockBody.children.length = 0;
    elementsById.clear();
  }
});

// Create common required DOM elements for tests
const mockMainContainer = createMockElement({ tagName: 'MAIN' });
mockMainContainer.className = 'container';
mockMainContainer.scrollHeight = 1000;
mockMainContainer.offsetHeight = 800;
mockBody.appendChild(mockMainContainer);

// Create a store for elements by ID for fast getElementById lookups
const elementsById = new Map();

globalThis.document = {
  body: mockBody,

  head: createMockElement({ tagName: 'HEAD' }),

  createElement: (tagName) => {
    const el = createMockElement({ tagName: tagName.toUpperCase() });

    // Override setAttribute to track IDs
    const originalSetAttribute = el.setAttribute;
    el.setAttribute = (name, value) => {
      originalSetAttribute.call(el, name, value);
      if (name === 'id') {
        elementsById.set(value, el);
      }
    };

    // Also track direct id assignment
    let _id = '';
    Object.defineProperty(el, 'id', {
      get() { return _id; },
      set(value) {
        _id = value;
        elementsById.set(value, el);
      }
    });

    // Override remove to clean up ID map
    const originalRemove = el.remove;
    el.remove = function() {
      if (_id) {
        elementsById.delete(_id);
      }
      originalRemove.call(this);
    };

    return el;
  },

  createElementNS: (ns, tagName) => {
    const el = createMockElement({ tagName: tagName.toUpperCase(), namespaceURI: ns });
    return el;
  },

  createTextNode: (text) => ({
    textContent: text,
    nodeType: 3,
  }),

  getElementById: (id) => {
    // First check the map
    if (elementsById.has(id)) {
      return elementsById.get(id);
    }
    // Then search the body
    return queryElement(mockBody, `#${id}`);
  },

  querySelector: (selector) => {
    return queryElement(mockBody, selector);
  },

  querySelectorAll: (selector) => {
    return queryAllElements(mockBody, selector);
  },

  getElementsByClassName: (className) => {
    return queryAllElements(mockBody, `.${className}`);
  },

  getElementsByTagName: (tagName) => {
    return queryAllElements(mockBody, tagName);
  },

  // For activeElement tracking
  activeElement: null,
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
 * Reset the DOM to a clean state
 * Call this in beforeEach() for DOM isolation between tests
 */
export function resetDOM() {
  // Clear the body's children
  mockBody.children.length = 0;

  // Clear the ID map
  elementsById.clear();

  // Reset body properties
  mockBody.textContent = '';
  mockBody.style = { overflow: '' };

  // Re-add required DOM elements
  mockBody.appendChild(mockMainContainer);
}

/**
 * Reset all global mocks to their initial state
 * Call this in beforeEach() when needed
 */
export function resetAllMocks() {
  mockFetch.mockClear();
  mockFetch.mockImplementation(MockResponses.success);

  // Reset DOM state
  resetDOM();

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
