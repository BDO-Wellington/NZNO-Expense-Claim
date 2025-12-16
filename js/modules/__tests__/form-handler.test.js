/**
 * Form Handler Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  buildLineItemsArray,
  collectVehicleData,
  collectFormData,
} from '../form-handler.js';

describe('buildLineItemsArray', () => {
  test('creates line items from expense items with amounts > 0', () => {
    const expenseItems = [
      { type: 'Flights', amount: 250, description: '', accountCode: '480' },
      { type: 'Meals', amount: 0, description: '', accountCode: '484' },
    ];
    const vehicleData = { kms: 0, amount: 0, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

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
    const vehicleData = { kms: 0, amount: 0, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result).toHaveLength(0);
  });

  test('formats Other expense with description prefix', () => {
    const expenseItems = [
      { type: 'Other', amount: 50, description: 'Conference fee', accountCode: '' }
    ];
    const vehicleData = { kms: 0, amount: 0, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result[0].description).toBe('Other Expenses - Conference fee');
    expect(result[0].accountCode).toBe('');
  });

  test('includes vehicle expense when kms and amount > 0', () => {
    const expenseItems = [];
    const vehicleData = { kms: 100, amount: 104, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

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
    const expenseItems = [];
    const vehicleData = { kms: 50, amount: 52, comment: 'Auckland trip' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result[0].description).toBe('Private Vehicle - Auckland trip');
  });

  test('excludes vehicle when kms is 0', () => {
    const expenseItems = [];
    const vehicleData = { kms: 0, amount: 104, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result).toHaveLength(0);
  });

  test('excludes vehicle when amount is 0', () => {
    const expenseItems = [];
    const vehicleData = { kms: 100, amount: 0, comment: '' };

    const result = buildLineItemsArray(expenseItems, vehicleData);

    expect(result).toHaveLength(0);
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
    const result = buildLineItemsArray([], { kms: 0, amount: 0, comment: '' });
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

  test('handles missing form fields gracefully', () => {
    const mockForm = {};

    const result = collectVehicleData(mockForm);

    expect(result).toEqual({
      kms: 0,
      rate: 0,
      amount: 0,
      comment: ''
    });
  });

  test('handles empty string values', () => {
    const mockForm = {
      kms: { value: '' },
      rate: { value: '' },
      vehicleAmount: { value: '' },
      vehicleComment: { value: '' }
    };

    const result = collectVehicleData(mockForm);

    expect(result).toEqual({
      kms: 0,
      rate: 0,
      amount: 0,
      comment: ''
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

  test('handles invalid numeric strings', () => {
    const mockForm = {
      kms: { value: 'abc' },
      rate: { value: 'not a number' },
      vehicleAmount: { value: '---' },
      vehicleComment: { value: 'valid comment' }
    };

    const result = collectVehicleData(mockForm);

    expect(result.kms).toBe(0);
    expect(result.rate).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.comment).toBe('valid comment');
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

  test('handles missing fields with empty strings', () => {
    const mockForm = {};

    const result = collectFormData(mockForm);

    expect(result).toEqual({
      fullName: '',
      employeeId: '',
      expenseDate: ''
    });
  });

  test('handles null field values', () => {
    const mockForm = {
      fullName: null,
      employeeId: undefined,
      expenseDate: { value: '2025-12-15' }
    };

    const result = collectFormData(mockForm);

    expect(result.fullName).toBe('');
    expect(result.employeeId).toBe('');
    expect(result.expenseDate).toBe('2025-12-15');
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
