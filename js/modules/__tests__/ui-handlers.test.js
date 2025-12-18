/**
 * UI Handlers Module Tests
 */
import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { createMockElement, createMockForm, resetAllMocks } from '../../../tests/setup.js';
import {
  showAlert,
  setFormToViewMode,
  updateVehicleAmount,
  removeExpenseRow,
} from '../ui-handlers.js';

// Store originals to restore after tests
const originalGetElementById = globalThis.document.getElementById;

describe('showAlert', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('creates alert element with correct message and type', () => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock((id) => {
      if (id === 'alert-container') return mockContainer;
      return null;
    });

    showAlert('Test message', 'danger');

    // Check the alert was appended as a child element
    expect(mockContainer.children.length).toBe(1);
    const alertDiv = mockContainer.children[0];
    expect(alertDiv.className).toBe('alert alert-danger');
    expect(alertDiv.textContent).toBe('Test message');
  });

  test('uses info type as default', () => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock((id) => {
      if (id === 'alert-container') return mockContainer;
      return null;
    });

    showAlert('Default type message');

    expect(mockContainer.children.length).toBe(1);
    expect(mockContainer.children[0].className).toContain('alert-info');
  });

  test('handles missing alert container gracefully', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => showAlert('Message', 'success')).not.toThrow();
  });

  test.each([
    { type: 'success', expected: 'alert-success' },
    { type: 'danger', expected: 'alert-danger' },
    { type: 'warning', expected: 'alert-warning' },
    { type: 'info', expected: 'alert-info' },
  ])('renders alert with type ', ({ type, expected }) => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock(() => mockContainer);

    showAlert('Message', type);

    expect(mockContainer.children.length).toBe(1);
    expect(mockContainer.children[0].className).toContain(expected);
  });
});

describe('setFormToViewMode', () => {
  test('disables all non-button form elements', () => {
    const mockInput = { tagName: 'INPUT', disabled: false };
    const mockTextarea = { tagName: 'TEXTAREA', disabled: false };
    const mockButton = { tagName: 'BUTTON', disabled: false };

    const mockForm = {
      elements: [mockInput, mockTextarea, mockButton],
      querySelectorAll: mock(() => []),
      querySelector: mock(() => null),
    };

    setFormToViewMode(mockForm);

    expect(mockInput.disabled).toBe(true);
    expect(mockTextarea.disabled).toBe(true);
    expect(mockButton.disabled).toBe(false);
  });

  test('hides submit button', () => {
    const mockSubmitBtn = { style: { display: '' } };
    const mockForm = {
      elements: [],
      querySelectorAll: mock(() => []),
      querySelector: mock((selector) => {
        if (selector === 'button[type="submit"]') return mockSubmitBtn;
        return null;
      }),
    };

    setFormToViewMode(mockForm);

    expect(mockSubmitBtn.style.display).toBe('none');
  });

  test('disables file inputs', () => {
    const mockFileInput = { disabled: false };
    const mockForm = {
      elements: [],
      querySelectorAll: mock((selector) => {
        if (selector === 'input[type="file"]') return [mockFileInput];
        return [];
      }),
      querySelector: mock(() => null),
    };

    setFormToViewMode(mockForm);

    expect(mockFileInput.disabled).toBe(true);
  });

  test('handles form without elements gracefully', () => {
    const mockForm = {
      elements: [],
      querySelectorAll: mock(() => []),
      querySelector: mock(() => null),
    };

    expect(() => setFormToViewMode(mockForm)).not.toThrow();
  });

  test('catches and logs errors', () => {
    const mockForm = {
      get elements() { throw new Error('Test error'); },
      querySelectorAll: mock(() => []),
      querySelector: mock(() => null),
    };

    expect(() => setFormToViewMode(mockForm)).not.toThrow();
  });
});

describe('updateVehicleAmount', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('updates vehicle amount input with calculated value', () => {
    const mockInput = { value: '' };
    globalThis.document.getElementById = mock((id) => {
      if (id === 'vehicleAmount') return mockInput;
      return null;
    });

    updateVehicleAmount(100);

    expect(mockInput.value).toBe('104.00');
  });

  test('handles zero kilometres', () => {
    const mockInput = { value: '' };
    globalThis.document.getElementById = mock(() => mockInput);

    updateVehicleAmount(0);

    expect(mockInput.value).toBe('0.00');
  });

  test('handles decimal kilometres', () => {
    const mockInput = { value: '' };
    globalThis.document.getElementById = mock(() => mockInput);

    updateVehicleAmount(50.5);

    expect(mockInput.value).toBe('52.52');
  });

  test('handles missing vehicle amount input', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => updateVehicleAmount(100)).not.toThrow();
  });
});

describe('removeExpenseRow', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('removes parent row when button clicked', async () => {
    const mockRemove = mock(() => {});
    const mockRow = {
      remove: mockRemove,
      querySelector: mock(() => null), // No description input, so row can be removed without confirmation
      classList: {
        add: mock(() => {}),
        remove: mock(() => {}),
      },
      style: {},
      offsetHeight: 50,
      addEventListener: mock((event, handler) => {
        // Immediately call the transitionend handler to complete removal
        if (event === 'transitionend') {
          setTimeout(handler, 0);
        }
      }),
    };
    const mockButton = {
      closest: mock((selector) => {
        if (selector === 'tr') return mockRow;
        return null;
      }),
    };

    await removeExpenseRow(mockButton);

    // Wait for setTimeout(200ms) in removeExpenseRow
    await new Promise(resolve => setTimeout(resolve, 250));

    expect(mockRemove).toHaveBeenCalled();
  });

  test('handles button with no parent row', () => {
    const mockButton = {
      closest: mock(() => null),
    };

    expect(() => removeExpenseRow(mockButton)).not.toThrow();
  });
});

describe('Button Loading States', () => {
  let setButtonLoading, setButtonLoadingWithText;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    setButtonLoading = module.setButtonLoading;
    setButtonLoadingWithText = module.setButtonLoadingWithText;
  });

  describe('setButtonLoading', () => {
    test('handles null button gracefully', () => {
      expect(() => setButtonLoading(null, true)).not.toThrow();
    });

    test('sets loading state on button', () => {
      const button = createMockElement({ tagName: 'BUTTON' });
      button.textContent = 'Submit';
      button.disabled = false;
      button.dataset = {};

      setButtonLoading(button, true);

      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.classList.contains('btn-loading')).toBe(true);
      expect(button.dataset.originalText).toBe('Submit');
    });

    test('restores button from loading state', () => {
      const button = createMockElement({ tagName: 'BUTTON' });
      button.textContent = 'Loading...';
      button.disabled = true;
      button.dataset = { originalText: 'Submit' };
      button.classList.add('btn-loading');

      setButtonLoading(button, false);

      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-busy')).toBe(null);
      expect(button.classList.contains('btn-loading')).toBe(false);
      expect(button.textContent).toBe('Submit');
    });

    test('adds spinner element when loading', () => {
      const button = createMockElement({ tagName: 'BUTTON' });
      button.textContent = 'Submit';
      button.dataset = {};

      setButtonLoading(button, true);

      const spinner = button.querySelector('.spinner');
      expect(spinner).not.toBeNull();
    });
  });

  describe('setButtonLoadingWithText', () => {
    test('handles null button gracefully', () => {
      expect(() => setButtonLoadingWithText(null, true)).not.toThrow();
    });

    test('sets custom loading text', () => {
      const button = createMockElement({ tagName: 'BUTTON' });
      button.textContent = 'Submit';
      button.dataset = {};

      setButtonLoadingWithText(button, true, 'Submitting...');

      const textSpan = button.querySelector('.btn-loading-text');
      expect(textSpan).not.toBeNull();
      expect(textSpan.textContent).toBe('Submitting...');
    });

    test('uses default loading text when not specified', () => {
      const button = createMockElement({ tagName: 'BUTTON' });
      button.textContent = 'Submit';
      button.dataset = {};

      setButtonLoadingWithText(button, true);

      const textSpan = button.querySelector('.btn-loading-text');
      expect(textSpan.textContent).toBe('Loading...');
    });
  });
});

describe('Progress Overlay', () => {
  let showProgressOverlay, updateProgressStatus, hideProgressOverlay, destroyProgressOverlay;

  beforeEach(async () => {
    resetAllMocks();
    // Reset module state by reimporting
    const module = await import('../ui-handlers.js');
    showProgressOverlay = module.showProgressOverlay;
    updateProgressStatus = module.updateProgressStatus;
    hideProgressOverlay = module.hideProgressOverlay;
    destroyProgressOverlay = module.destroyProgressOverlay;
    // Clean up any existing overlay
    destroyProgressOverlay();
  });

  afterEach(() => {
    destroyProgressOverlay();
  });

  test('showProgressOverlay creates overlay element', () => {
    showProgressOverlay('Test Title', 'Test Status');

    const overlay = document.getElementById('progress-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.classList.contains('visible')).toBe(true);
  });

  test('showProgressOverlay sets title and status text', () => {
    showProgressOverlay('Processing', 'Please wait...');

    const overlay = document.getElementById('progress-overlay');
    const title = overlay.querySelector('#progress-title');
    const status = overlay.querySelector('#progress-status');

    expect(title.textContent).toBe('Processing');
    expect(status.textContent).toBe('Please wait...');
  });

  test('showProgressOverlay has correct accessibility attributes', () => {
    showProgressOverlay();

    const overlay = document.getElementById('progress-overlay');
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(overlay.getAttribute('aria-labelledby')).toBe('progress-title');
  });

  test('showProgressOverlay prevents body scroll', () => {
    showProgressOverlay();

    expect(document.body.style.overflow).toBe('hidden');
  });

  test('updateProgressStatus updates status text', () => {
    showProgressOverlay('Title', 'Initial status');
    updateProgressStatus('Updated status');

    const status = document.querySelector('#progress-status');
    expect(status.textContent).toBe('Updated status');
  });

  test('hideProgressOverlay removes visible class', () => {
    showProgressOverlay();
    hideProgressOverlay();

    const overlay = document.getElementById('progress-overlay');
    expect(overlay.classList.contains('visible')).toBe(false);
  });

  test('hideProgressOverlay restores body scroll', () => {
    showProgressOverlay();
    hideProgressOverlay();

    expect(document.body.style.overflow).toBe('');
  });

  test('destroyProgressOverlay removes overlay from DOM', () => {
    showProgressOverlay();
    const overlayBefore = document.getElementById('progress-overlay');
    expect(overlayBefore).not.toBeNull();

    destroyProgressOverlay();

    // Check that the overlay no longer has a parent (was removed)
    expect(overlayBefore.parentNode).toBeNull();
  });
});

describe('Attachment Error Display', () => {
  let showAttachmentError, hideAttachmentError;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    showAttachmentError = module.showAttachmentError;
    hideAttachmentError = module.hideAttachmentError;
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('showAttachmentError displays error message', () => {
    const mockContainer = createMockElement();
    mockContainer.classList.add('d-none');
    globalThis.document.getElementById = mock((id) => {
      if (id === 'attachmentsError') return mockContainer;
      return null;
    });

    showAttachmentError('File too large');

    expect(mockContainer.textContent).toBe('File too large');
    expect(mockContainer.classList.contains('d-none')).toBe(false);
  });

  test('showAttachmentError handles missing container', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => showAttachmentError('Error')).not.toThrow();
  });

  test('hideAttachmentError adds d-none class', () => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock((id) => {
      if (id === 'attachmentsError') return mockContainer;
      return null;
    });

    hideAttachmentError();

    expect(mockContainer.classList.contains('d-none')).toBe(true);
  });

  test('hideAttachmentError handles missing container', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => hideAttachmentError()).not.toThrow();
  });
});

describe('Print Mode', () => {
  let enablePrintMode, disablePrintMode;
  const originalQuerySelector = globalThis.document.querySelector;
  const originalQuerySelectorAll = globalThis.document.querySelectorAll;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    enablePrintMode = module.enablePrintMode;
    disablePrintMode = module.disablePrintMode;
  });

  afterEach(() => {
    globalThis.document.querySelector = originalQuerySelector;
    globalThis.document.querySelectorAll = originalQuerySelectorAll;
  });

  test('enablePrintMode adds print-friendly class to main container', () => {
    const mockMain = createMockElement({ tagName: 'MAIN' });
    mockMain.className = 'container';
    globalThis.document.querySelector = mock((selector) => {
      if (selector === 'main.container') return mockMain;
      return null;
    });
    globalThis.document.querySelectorAll = mock(() => []);

    enablePrintMode();

    expect(mockMain.classList.contains('print-friendly')).toBe(true);
  });

  test('enablePrintMode shows page-break elements', () => {
    const mockBreak = createMockElement();
    mockBreak.style.display = 'none';
    globalThis.document.querySelector = mock(() => null);
    globalThis.document.querySelectorAll = mock((selector) => {
      if (selector === '.page-break') return [mockBreak];
      return [];
    });

    enablePrintMode();

    expect(mockBreak.style.display).toBe('block');
  });

  test('disablePrintMode removes print-friendly class', () => {
    const mockMain = createMockElement({ tagName: 'MAIN' });
    mockMain.className = 'container print-friendly';
    globalThis.document.querySelector = mock((selector) => {
      if (selector === 'main.container') return mockMain;
      return null;
    });

    disablePrintMode();

    expect(mockMain.classList.contains('print-friendly')).toBe(false);
  });

  test('disablePrintMode handles missing main container', () => {
    globalThis.document.querySelector = mock(() => null);

    expect(() => disablePrintMode()).not.toThrow();
  });
});

describe('Default Date', () => {
  let setDefaultDate;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    setDefaultDate = module.setDefaultDate;
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('sets today date on empty date input', () => {
    const mockDateInput = createMockElement({ tagName: 'INPUT' });
    mockDateInput.value = '';
    globalThis.document.getElementById = mock((id) => {
      if (id === 'expenseDate') return mockDateInput;
      return null;
    });

    setDefaultDate();

    // Should be in YYYY-MM-DD format
    expect(mockDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('does not overwrite existing date value', () => {
    const mockDateInput = createMockElement({ tagName: 'INPUT' });
    mockDateInput.value = '2025-01-01';
    globalThis.document.getElementById = mock((id) => {
      if (id === 'expenseDate') return mockDateInput;
      return null;
    });

    setDefaultDate();

    expect(mockDateInput.value).toBe('2025-01-01');
  });

  test('handles missing date input', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => setDefaultDate()).not.toThrow();
  });
});

describe('PDF Button', () => {
  let hidePdfButton;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    hidePdfButton = module.hidePdfButton;
  });

  afterEach(() => {
    globalThis.document.getElementById = originalGetElementById;
  });

  test('hides PDF download button', () => {
    const mockButton = createMockElement({ tagName: 'BUTTON' });
    mockButton.style.display = '';
    globalThis.document.getElementById = mock((id) => {
      if (id === 'downloadPdfButton') return mockButton;
      return null;
    });

    hidePdfButton();

    expect(mockButton.style.display).toBe('none');
  });

  test('handles missing PDF button', () => {
    globalThis.document.getElementById = mock(() => null);

    expect(() => hidePdfButton()).not.toThrow();
  });
});

describe('Scroll Input Disable', () => {
  let disableScrollOnInput, disableScrollOnNumberInputs;
  const originalQuerySelectorAll = globalThis.document.querySelectorAll;

  beforeEach(async () => {
    resetAllMocks();
    const module = await import('../ui-handlers.js');
    disableScrollOnInput = module.disableScrollOnInput;
    disableScrollOnNumberInputs = module.disableScrollOnNumberInputs;
  });

  afterEach(() => {
    globalThis.document.querySelectorAll = originalQuerySelectorAll;
  });

  test('attaches wheel event listener to number input', () => {
    const mockInput = createMockElement({ tagName: 'INPUT' });
    mockInput.type = 'number';

    disableScrollOnInput(mockInput);

    expect(mockInput._eventListeners.wheel).toBeDefined();
    expect(mockInput._eventListeners.wheel.length).toBeGreaterThan(0);
  });

  test('does not attach listener to non-number input', () => {
    const mockInput = createMockElement({ tagName: 'INPUT' });
    mockInput.type = 'text';

    disableScrollOnInput(mockInput);

    expect(mockInput._eventListeners.wheel || []).toHaveLength(0);
  });

  test('handles null input', () => {
    expect(() => disableScrollOnInput(null)).not.toThrow();
  });

  test('disableScrollOnNumberInputs applies to all number inputs', () => {
    const mockInput1 = createMockElement({ tagName: 'INPUT' });
    mockInput1.type = 'number';
    const mockInput2 = createMockElement({ tagName: 'INPUT' });
    mockInput2.type = 'number';

    globalThis.document.querySelectorAll = mock((selector) => {
      if (selector === 'input[type="number"]') return [mockInput1, mockInput2];
      return [];
    });

    disableScrollOnNumberInputs();

    expect(mockInput1._eventListeners.wheel.length).toBeGreaterThan(0);
    expect(mockInput2._eventListeners.wheel.length).toBeGreaterThan(0);
  });
});