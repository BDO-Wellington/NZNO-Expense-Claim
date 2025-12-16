/**
 * Form Handler Module Tests (Unit Tests)
 */
import { describe, expect, test } from 'bun:test';
import {
  buildLineItemsArray,
  collectVehicleData,
  collectFormData,
} from '../form-handler.js';

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

  describe('vehicle expense handling', () => {
    test('includes vehicle when kms and amount > 0', () => {
      const vehicleData = { kms: 100, amount: 104, comment: '' };

      const result = buildLineItemsArray([], vehicleData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        description: 'Private Vehicle',
        quantity: 1,
        amount: 104,
        accountCode: '481',
        taxType: ''
      });
    });

    test('includes vehicle comment in description when provided', () => {
      const vehicleData = { kms: 50, amount: 52, comment: 'Auckland trip' };

      const result = buildLineItemsArray([], vehicleData);

      expect(result[0].description).toBe('Private Vehicle - Auckland trip');
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
      { type: 'Meals', amount: 45, description: '', accountCode: '484' },
    ];
    const vehicleData = { kms: 100, amount: 104, comment: 'Site visit' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result).toHaveLength(3);
    expect(result[0].description).toBe('Flights');
    expect(result[1].description).toBe('Meals');
    expect(result[2].description).toBe('Private Vehicle - Site visit');
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
      rate: { value: '1.04' },
      vehicleAmount: { value: '104' },
      vehicleComment: { value: 'Site visit' }
    };

    const result = collectVehicleData(mockForm);

    expect(result).toEqual({
      kms: 100,
      rate: 1.04,
      amount: 104,
      comment: 'Site visit'
    });
  });

  describe('handles edge cases gracefully', () => {
    test.each([
      {
        desc: 'missing form fields',
        form: {},
        expected: { kms: 0, rate: 0, amount: 0, comment: '' }
      },
      {
        desc: 'empty string values',
        form: { kms: { value: '' }, rate: { value: '' }, vehicleAmount: { value: '' }, vehicleComment: { value: '' } },
        expected: { kms: 0, rate: 0, amount: 0, comment: '' }
      },
      {
        desc: 'invalid numeric strings',
        form: { kms: { value: 'abc' }, rate: { value: 'not a number' }, vehicleAmount: { value: '---' }, vehicleComment: { value: 'valid comment' } },
        expected: { kms: 0, rate: 0, amount: 0, comment: 'valid comment' }
      },
    ])('$desc', ({ form, expected }) => {
      expect(collectVehicleData(form)).toEqual(expected);
    });
  });

  test('handles decimal values', () => {
    const mockForm = {
      kms: { value: '50.5' },
      rate: { value: '1.04' },
      vehicleAmount: { value: '52.52' },
      vehicleComment: { value: '' }
    };

    const result = collectVehicleData(mockForm);

    expect(result.kms).toBe(50.5);
    expect(result.amount).toBe(52.52);
  });
});

describe('collectFormData', () => {
  test('extracts basic form data', () => {
    const mockForm = {
      fullName: { value: 'John Smith' },
      employeeId: { value: 'EMP001' },
      expenseDate: { value: '2025-12-15' }
    };

    const result = collectFormData(mockForm);

    expect(result).toEqual({
      fullName: 'John Smith',
      employeeId: 'EMP001',
      expenseDate: '2025-12-15'
    });
  });

  describe('handles missing/invalid fields', () => {
    test.each([
      {
        desc: 'empty form',
        form: {},
        expected: { fullName: '', employeeId: '', expenseDate: '' }
      },
      {
        desc: 'null field values',
        form: { fullName: null, employeeId: undefined, expenseDate: { value: '2025-12-15' } },
        expected: { fullName: '', employeeId: '', expenseDate: '2025-12-15' }
      },
    ])('$desc', ({ form, expected }) => {
      expect(collectFormData(form)).toEqual(expected);
    });
  });

  test('preserves whitespace in values', () => {
    const mockForm = {
      fullName: { value: '  John Smith  ' },
      employeeId: { value: 'EMP001' },
      expenseDate: { value: '2025-12-15' }
    };

    const result = collectFormData(mockForm);

    expect(result.fullName).toBe('  John Smith  ');
  });
});
