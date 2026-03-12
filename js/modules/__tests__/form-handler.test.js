/**
 * Form Handler Module Tests (Unit Tests)
 */
import { describe, expect, test, beforeEach } from 'bun:test';
import {
  buildLineItemsArray,
  collectVehicleData,
  collectFormData,
} from '../form-handler.js';

// Helper: mock a claimant type radio button in the DOM so getClaimantType() returns the desired value
const origQuerySelector = document.querySelector.bind(document);
function mockClaimantType(type) {
  document.querySelector = function(selector) {
    if (selector === 'input[name="claimantType"]:checked') {
      return { value: type };
    }
    return origQuerySelector(selector);
  };
}

function clearClaimantTypeMock() {
  document.querySelector = origQuerySelector;
}

describe('buildLineItemsArray', () => {
  const emptyVehicle = { kms: 0, amount: 0, comment: '' };

  test('creates line items from expense items with amounts > 0', () => {
    const expenseItems = [
      { type: 'Flights', amount: 250, description: '', accountCode: '480' },
      { type: 'Meals', amount: 0, description: '', accountCode: '484' },
    ];

    const result = buildLineItemsArray(expenseItems, emptyVehicle);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      description: 'Flights',
      quantity: 1,
      amount: 250,
      accountCode: '480',
      taxType: ''
    });
  });

  test('excludes items with zero amount', () => {
    const expenseItems = [
      { type: 'Flights', amount: 0, description: '', accountCode: '480' },
      { type: 'Accommodation', amount: 0, description: '', accountCode: '484' },
    ];

    const result = buildLineItemsArray(expenseItems, emptyVehicle);

    expect(result).toHaveLength(0);
  });

  test('formats Other expense with description prefix', () => {
    const expenseItems = [
      { type: 'Other', amount: 50, description: 'Conference fee', accountCode: '' }
    ];

    const result = buildLineItemsArray(expenseItems, emptyVehicle);

    expect(result[0].description).toBe('Other Expenses - Conference fee');
    expect(result[0].accountCode).toBe('');
  });

  test('includes notes in description for standard expenses', () => {
    const expenseItems = [
      { type: 'Flights', amount: 250, description: 'Return AKL-WLG', accountCode: '480' }
    ];

    const result = buildLineItemsArray(expenseItems, emptyVehicle);

    expect(result[0].description).toBe('Flights - Return AKL-WLG');
  });

  describe('vehicle expense handling', () => {
    test('includes vehicle when kms and amount > 0', () => {
      const vehicleData = { kms: 100, amount: 104, comment: '' };

      const result = buildLineItemsArray([], vehicleData);

      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('Private Vehicle');
      expect(result[0].quantity).toBe(1);
      expect(result[0].amount).toBe(104);
      expect(result[0].accountCode).toBe('481');
      expect(result[0].taxType).toBe('');
    });

    test('includes vehicle comment in description when provided', () => {
      const vehicleData = { kms: 50, amount: 52, comment: 'Auckland trip' };

      const result = buildLineItemsArray([], vehicleData);

      expect(result[0].description).toContain('Auckland trip');
    });

    test('includes vehicle type and route in description', () => {
      const vehicleData = {
        kms: 50, amount: 63, comment: '',
        vehicleType: 'diesel',
        travelledFrom: 'Auckland',
        travelledTo: 'Hamilton'
      };

      const result = buildLineItemsArray([], vehicleData);

      expect(result[0].description).toContain('diesel');
      expect(result[0].description).toContain('Auckland to Hamilton');
    });

    test.each([
      { kms: 0, amount: 104, comment: '', desc: 'kms is 0' },
      { kms: 100, amount: 0, comment: '', desc: 'amount is 0' },
      { kms: 0, amount: 0, comment: '', desc: 'both are 0' },
    ])('excludes vehicle when $desc', (vehicleData) => {
      const result = buildLineItemsArray([], vehicleData);
      expect(result).toHaveLength(0);
    });
  });

  test('combines expense items and vehicle data', () => {
    const expenseItems = [
      { type: 'Flights', amount: 250, description: '', accountCode: '480' },
      { type: 'Breakfast', amount: 25, description: '', accountCode: '484' },
    ];
    const vehicleData = { kms: 100, amount: 104, comment: 'Site visit' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result).toHaveLength(3);
    expect(result[0].description).toBe('Flights');
    expect(result[1].description).toBe('Breakfast');
    expect(result[2].description).toContain('Private Vehicle');
    expect(result[2].description).toContain('Site visit');
  });

  test('handles empty inputs', () => {
    const result = buildLineItemsArray([], emptyVehicle);
    expect(result).toEqual([]);
  });
});

describe('collectVehicleData', () => {
  test('extracts vehicle data from form', () => {
    const mockForm = {
      kms: { value: '100' },
      rate: { value: '1.17' },
      vehicleAmount: { value: '117' },
      vehicleComment: { value: 'Site visit' },
      travelledFrom: { value: 'Auckland' },
      travelledTo: { value: 'Hamilton' }
    };

    const result = collectVehicleData(mockForm);

    expect(result.kms).toBe(100);
    expect(result.rate).toBe(1.17);
    expect(result.amount).toBe(117);
    expect(result.comment).toBe('Site visit');
    expect(result.travelledFrom).toBe('Auckland');
    expect(result.travelledTo).toBe('Hamilton');
    expect(result.vehicleType).toBeDefined();
  });

  describe('handles edge cases gracefully', () => {
    test.each([
      {
        desc: 'missing form fields',
        form: {},
      },
      {
        desc: 'empty string values',
        form: { kms: { value: '' }, rate: { value: '' }, vehicleAmount: { value: '' }, vehicleComment: { value: '' } },
      },
      {
        desc: 'invalid numeric strings',
        form: { kms: { value: 'abc' }, rate: { value: 'not a number' }, vehicleAmount: { value: '---' }, vehicleComment: { value: 'valid comment' } },
      },
    ])('$desc', ({ form }) => {
      const result = collectVehicleData(form);
      expect(result.kms).toBe(form.kms?.value === 'abc' ? 0 : 0);
      expect(result.rate).toBe(0);
      expect(result.amount).toBe(0);
    });
  });

  test('handles decimal values', () => {
    const mockForm = {
      kms: { value: '50.5' },
      rate: { value: '1.17' },
      vehicleAmount: { value: '59.09' },
      vehicleComment: { value: '' }
    };

    const result = collectVehicleData(mockForm);

    expect(result.kms).toBe(50.5);
    expect(result.amount).toBe(59.09);
  });
});

describe('collectFormData', () => {
  beforeEach(() => {
    mockClaimantType('member');
  });

  test('extracts basic form data with member defaults', () => {
    const mockForm = {
      fullName: { value: 'John Smith' },
      email: { value: 'john@example.com' },
      expenseDate: { value: '2025-12-15' },
      eventReason: { value: 'Conference' },
      travelStartDate: { value: '2025-12-14T08:00' },
      travelEndDate: { value: '2025-12-16T18:00' },
      numberOfDays: { value: '3' },
      costCentre: { value: 'CC100' },
      bankAccountName: { value: 'John Smith' },
      bankAccountNumber: { value: '01-1234-5678901-00' },
      membershipNumber: { value: 'MEM001' },
      querySelector: (selector) => {
        if (selector === '#nznoStaffContactMember') return { value: 'Jane Doe' };
        return null;
      }
    };

    const result = collectFormData(mockForm);

    expect(result.fullName).toBe('John Smith');
    expect(result.email).toBe('john@example.com');
    expect(result.expenseDate).toBe('2025-12-15');
    expect(result.claimantType).toBe('member');
    expect(result.membershipNumber).toBe('MEM001');
    expect(result.nznoStaffContact).toBe('Jane Doe');
    expect(result.bankAccountName).toBe('John Smith');
  });

  describe('handles missing/invalid fields', () => {
    test('empty form returns defaults', () => {
      const mockForm = {
        querySelector: () => null
      };
      const result = collectFormData(mockForm);
      expect(result.fullName).toBe('');
      expect(result.email).toBe('');
      expect(result.expenseDate).toBe('');
      expect(result.claimantType).toBe('member');
    });
  });

  test('preserves whitespace in values', () => {
    const mockForm = {
      fullName: { value: '  John Smith  ' },
      email: { value: 'john@example.com' },
      expenseDate: { value: '2025-12-15' },
      eventReason: { value: '' },
      travelStartDate: { value: '' },
      travelEndDate: { value: '' },
      numberOfDays: { value: '' },
      costCentre: { value: '' },
      bankAccountName: { value: '' },
      bankAccountNumber: { value: '' },
      membershipNumber: { value: '' },
      querySelector: () => null
    };

    const result = collectFormData(mockForm);

    expect(result.fullName).toBe('  John Smith  ');
  });
});
