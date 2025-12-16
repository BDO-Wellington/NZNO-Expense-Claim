/**
 * Expense Types Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  EXPENSE_TYPES,
  VEHICLE_RATE,
  VEHICLE_ACCOUNT_CODE,
  getExpenseByName,
  getAccountCode,
  calculateVehicleAmount,
  getExpenseTypeNames,
  isValidExpenseType,
} from '../expense-types.js';

describe('constants', () => {
  test('EXPENSE_TYPES contains expected expense categories', () => {
    expect(EXPENSE_TYPES.length).toBeGreaterThan(0);
    expect(EXPENSE_TYPES.some(t => t.name === 'Flights')).toBe(true);
    expect(EXPENSE_TYPES.some(t => t.name === 'Accommodation')).toBe(true);
  });

  test('each expense type has name and accountCode', () => {
    EXPENSE_TYPES.forEach(type => {
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('accountCode');
      expect(typeof type.name).toBe('string');
      expect(typeof type.accountCode).toBe('string');
    });
  });

  test('VEHICLE_RATE is a positive number', () => {
    expect(typeof VEHICLE_RATE).toBe('number');
    expect(VEHICLE_RATE).toBeGreaterThan(0);
  });

  test('VEHICLE_ACCOUNT_CODE is defined', () => {
    expect(VEHICLE_ACCOUNT_CODE).toBe('481');
  });
});

describe('getExpenseByName', () => {
  describe('valid expense names', () => {
    test.each([
      { name: 'Flights', expectedCode: '480' },
      { name: 'Accommodation', expectedCode: '484' },
      { name: 'Parking', expectedCode: '482' },
      { name: 'Meals', expectedCode: '484' },
    ])('returns expense object for $name', ({ name, expectedCode }) => {
      const expense = getExpenseByName(name);
      expect(expense).toBeDefined();
      expect(expense.name).toBe(name);
      expect(expense.accountCode).toBe(expectedCode);
    });
  });

  describe('invalid expense names', () => {
    test.each([
      { name: 'Invalid Type', desc: 'non-existent type' },
      { name: '', desc: 'empty string' },
      { name: 'flights', desc: 'lowercase (case sensitive)' },
      { name: 'FLIGHTS', desc: 'uppercase (case sensitive)' },
    ])('returns undefined for $desc', ({ name }) => {
      expect(getExpenseByName(name)).toBeUndefined();
    });
  });
});

describe('getAccountCode', () => {
  describe('valid expense types', () => {
    test.each([
      { type: 'Flights', code: '480' },
      { type: 'Accommodation', code: '484' },
      { type: 'Parking', code: '482' },
    ])('$type -> $code', ({ type, code }) => {
      expect(getAccountCode(type)).toBe(code);
    });
  });

  describe('invalid expense types', () => {
    test.each([
      { type: 'Invalid', desc: 'non-existent' },
      { type: '', desc: 'empty string' },
    ])('returns empty string for $desc', ({ type }) => {
      expect(getAccountCode(type)).toBe('');
    });
  });
});

describe('calculateVehicleAmount', () => {
  test.each([
    { kms: 100, expected: 100 * VEHICLE_RATE, desc: '100km' },
    { kms: 50, expected: 50 * VEHICLE_RATE, desc: '50km' },
    { kms: 0, expected: 0, desc: 'zero km' },
    { kms: 25.5, expected: 25.5 * VEHICLE_RATE, desc: 'decimal km' },
  ])('calculates $desc correctly', ({ kms, expected }) => {
    expect(calculateVehicleAmount(kms)).toBe(expected);
  });
});

describe('getExpenseTypeNames', () => {
  test('returns array of expense type names', () => {
    const names = getExpenseTypeNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(EXPENSE_TYPES.length);
    expect(names).toContain('Flights');
    expect(names).toContain('Meals');
  });

  test('returns only strings', () => {
    const names = getExpenseTypeNames();
    names.forEach(name => {
      expect(typeof name).toBe('string');
    });
  });
});

describe('isValidExpenseType', () => {
  describe('valid types', () => {
    test.each([
      { type: 'Flights' },
      { type: 'Taxi/Uber' },
      { type: 'Meals' },
      { type: 'Accommodation' },
    ])('returns true for $type', ({ type }) => {
      expect(isValidExpenseType(type)).toBe(true);
    });
  });

  describe('invalid types', () => {
    test.each([
      { type: 'Invalid', desc: 'non-existent' },
      { type: '', desc: 'empty string' },
      { type: 'flights', desc: 'lowercase (case sensitive)' },
      { type: 'MEALS', desc: 'uppercase (case sensitive)' },
    ])('returns false for $desc: "$type"', ({ type }) => {
      expect(isValidExpenseType(type)).toBe(false);
    });
  });
});
