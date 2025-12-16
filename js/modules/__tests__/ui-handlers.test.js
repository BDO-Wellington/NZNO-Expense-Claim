/**
 * UI Handlers Module Tests
 */
import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { createMockElement, createMockForm, resetAllMocks } from '../../../tests/setup.js';
import {
  showAlert,
  setFormToViewMode,
  updateVehicleAmount,
  removeExpenseRow,
} from '../ui-handlers.js';

describe('showAlert', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('sets alert container innerHTML with correct message and type', () => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock((id) => {
      if (id === 'alert-container') return mockContainer;
      return null;
    });

    showAlert('Test message', 'danger');

    expect(mockContainer.innerHTML).toBe('<div class="alert alert-danger" role="alert">Test message</div>');
  });

  test('uses info type as default', () => {
    const mockContainer = createMockElement();
    globalThis.document.getElementById = mock((id) => {
      if (id === 'alert-container') return mockContainer;
      return null;
    });

    showAlert('Default type message');

    expect(mockContainer.innerHTML).toContain('alert-info');
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

    expect(mockContainer.innerHTML).toContain(expected);
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
  test('removes parent row when button clicked', () => {
    const mockRemove = mock(() => {});
    const mockRow = { remove: mockRemove };
    const mockButton = {
      closest: mock((selector) => {
        if (selector === 'tr') return mockRow;
        return null;
      }),
    };

    removeExpenseRow(mockButton);

    expect(mockRemove).toHaveBeenCalled();
  });

  test('handles button with no parent row', () => {
    const mockButton = {
      closest: mock(() => null),
    };

    expect(() => removeExpenseRow(mockButton)).not.toThrow();
  });
});