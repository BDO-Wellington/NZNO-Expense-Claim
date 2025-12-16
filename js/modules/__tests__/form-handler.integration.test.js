/**
 * Form Handler Integration Tests
 *
 * These tests verify the form submission workflow including
 * API calls and data transformation.
 *
 * Browser globals are provided by tests/setup.js preload.
 */
import { describe, expect, test, mock, beforeEach } from 'bun:test';
import {
  mockFetch,
  resetAllMocks,
  createMockForm,
  createMockEvent,
  MockResponses,
  setFetchResponse,
  getFetchBody,
  getFetchUrl,
} from '../../../tests/setup.js';

// Import the module under test
import { handleFormSubmit, submitBulk, submitIndividualItems } from '../form-handler.js';

describe('submitBulk', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('returns true on successful submission', async () => {
    expect.assertions(1);

    const expenseItems = [];
    const vehicleData = { kms: 0, amount: 0, comment: '' };
    const formData = { fullName: 'Test', employeeId: 'E1', expenseDate: '2025-12-15' };

    const result = await submitBulk(expenseItems, vehicleData, formData, 'https://api.test.com', { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false });

    expect(result).toBe(true);
  });

  test('returns false when fetch fails', async () => {
    expect.assertions(1);

    setFetchResponse(() => MockResponses.failure(400));

    const result = await submitBulk(
      [],
      { kms: 0, amount: 0, comment: '' },
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com',
      { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
    );

    expect(result).toBe(false);
  });

  test('returns false on network error', async () => {
    expect.assertions(1);

    setFetchResponse(() => MockResponses.networkError('Connection refused'));

    const result = await submitBulk(
      [],
      { kms: 0, amount: 0, comment: '' },
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com',
      { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
    );

    expect(result).toBe(false);
  });

  test('sends POST request with correct URL', async () => {
    expect.assertions(1);

    await submitBulk(
      [],
      { kms: 0, amount: 0, comment: '' },
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://my-api.com/submit',
      { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }
    );

    expect(getFetchUrl()).toBe('https://my-api.com/submit');
  });

  test('base64 encodes lineItems when stringify enabled', async () => {
    expect.assertions(1);

    const items = [{ type: 'Flights', amount: 250, description: '', accountCode: '480' }];

    await submitBulk(
      items,
      { kms: 0, amount: 0, comment: '' },
      { fullName: 'J', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com',
      { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }
    );

    const payload = getFetchBody();
    expect(typeof payload.lineItems).toBe('string');
  });
});

describe('submitIndividualItems', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('returns false when no items have amount', async () => {
    expect.assertions(1);

    const items = [{ type: 'Flights', amount: 0, accountCode: '480' }];

    const result = await submitIndividualItems(
      items,
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com'
    );

    expect(result).toBe(false);
  });

  test('submits only items with amount > 0', async () => {
    expect.assertions(1);

    const items = [
      { type: 'Flights', amount: 250, accountCode: '480' },
      { type: 'Meals', amount: 0, accountCode: '484' },
      { type: 'Parking', amount: 25, accountCode: '482' }
    ];

    await submitIndividualItems(
      items,
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com'
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('returns false if any submission fails', async () => {
    expect.assertions(1);

    // Use sequential responses: first succeeds, second fails
    setFetchResponse(MockResponses.sequential([
      MockResponses.success,
      MockResponses.failure,
    ]));

    const items = [
      { type: 'A', amount: 100, accountCode: '1' },
      { type: 'B', amount: 50, accountCode: '2' }
    ];

    const result = await submitIndividualItems(
      items,
      { fullName: 'T', employeeId: 'E', expenseDate: '2025-12-15' },
      'https://api.test.com'
    );

    expect(result).toBe(false);
  });
});

describe('handleFormSubmit', () => {
  beforeEach(() => {
    resetAllMocks();
    globalThis.document.querySelectorAll = mock(() => []);
  });

  test('calls preventDefault', async () => {
    expect.assertions(1);

    const mockPreventDefault = mock(() => {});
    const mockEvent = {
      preventDefault: mockPreventDefault,
      target: createMockForm({
        fullName: 'T',
        employeeId: 'E',
        expenseDate: '2025-12-15',
        kms: '0',
        rate: '1',
        vehicleAmount: '0',
        vehicleComment: ''
      })
    };

    await handleFormSubmit(mockEvent, { API_URL: 'https://api.test.com', SUBMIT_INDIVIDUAL_LINE_ITEMS: false });

    expect(mockPreventDefault).toHaveBeenCalled();
  });

  test('uses API_URL from config', async () => {
    expect.assertions(1);

    const mockEvent = createMockEvent(
      createMockForm({
        fullName: 'T',
        employeeId: 'E',
        expenseDate: '2025-12-15',
        kms: '0',
        rate: '1',
        vehicleAmount: '0',
        vehicleComment: ''
      })
    );

    await handleFormSubmit(mockEvent, {
      API_URL: 'https://custom.api.com/submit',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false,
      STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false
    });

    expect(getFetchUrl()).toBe('https://custom.api.com/submit');
  });

  test('collects form data', async () => {
    expect.assertions(2);

    const mockEvent = createMockEvent(
      createMockForm({
        fullName: 'Jane Doe',
        employeeId: 'EMP999',
        expenseDate: '2025-06-15',
        kms: '0',
        rate: '1',
        vehicleAmount: '0',
        vehicleComment: ''
      })
    );

    await handleFormSubmit(mockEvent, {
      API_URL: 'https://api.test.com',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false,
      STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false
    });

    const payload = getFetchBody();
    expect(payload.fullName).toBe('Jane Doe');
    expect(payload.employeeId).toBe('EMP999');
  });
});
