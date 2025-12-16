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
  test('returns expense object for valid name', () => {
    const flights = getExpenseByName('Flights');
    expect(flights).toBeDefined();
    expect(flights.name).toBe('Flights');
    expect(flights.accountCode).toBe('480');
  });

  test('returns undefined for invalid name', () => {
    expect(getExpenseByName('Invalid Type')).toBeUndefined();
    expect(getExpenseByName('')).toBeUndefined();
  });

  test('is case sensitive', () => {
    expect(getExpenseByName('flights')).toBeUndefined();
    expect(getExpenseByName('FLIGHTS')).toBeUndefined();
  });
});

describe('getAccountCode', () => {
  test('returns correct account code for valid expense', () => {
    expect(getAccountCode('Flights')).toBe('480');
    expect(getAccountCode('Accommodation')).toBe('484');
    expect(getAccountCode('Parking')).toBe('482');
  });

  test('returns empty string for invalid expense', () => {
    expect(getAccountCode('Invalid')).toBe('');
    expect(getAccountCode('')).toBe('');
  });
});

describe('calculateVehicleAmount', () => {
  test('calculates correct amount for kilometres', () => {
    expect(calculateVehicleAmount(100)).toBe(100 * VEHICLE_RATE);
    expect(calculateVehicleAmount(50)).toBe(50 * VEHICLE_RATE);
  });

  test('handles zero kilometres', () => {
    expect(calculateVehicleAmount(0)).toBe(0);
  });

  test('handles decimal kilometres', () => {
    expect(calculateVehicleAmount(25.5)).toBe(25.5 * VEHICLE_RATE);
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
  test('returns true for valid expense types', () => {
    expect(isValidExpenseType('Flights')).toBe(true);
    expect(isValidExpenseType('Taxi/Uber')).toBe(true);
    expect(isValidExpenseType('Meals')).toBe(true);
  });

  test('returns false for invalid expense types', () => {
    expect(isValidExpenseType('Invalid')).toBe(false);
    expect(isValidExpenseType('')).toBe(false);
    expect(isValidExpenseType('flights')).toBe(false); // case sensitive
  });
});
