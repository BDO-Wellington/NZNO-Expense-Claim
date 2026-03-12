/**
 * Expense Types Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  EXPENSE_TYPES,
  STAFF_ONLY_EXPENSES,
  VEHICLE_RATE,
  VEHICLE_RATES,
  VEHICLE_ACCOUNT_CODE,
  DEFAULT_VEHICLE_TYPE,
  getExpenseByName,
  getAccountCode,
  getVehicleRate,
  getVehicleTypeOptions,
  calculateVehicleAmount,
  getExpenseTypeNames,
  isValidExpenseType,
} from '../expense-types.js';

describe('constants', () => {
  test('EXPENSE_TYPES contains expected expense categories', () => {
    expect(EXPENSE_TYPES.length).toBeGreaterThan(0);
    expect(EXPENSE_TYPES.some(t => t.name === 'Flights')).toBe(true);
    expect(EXPENSE_TYPES.some(t => t.name === 'Accommodation')).toBe(true);
    expect(EXPENSE_TYPES.some(t => t.name === 'Meals')).toBe(true);
  });

  test('each expense type has name, accountCode, and renderType', () => {
    EXPENSE_TYPES.forEach(type => {
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('accountCode');
      expect(type).toHaveProperty('renderType');
      expect(typeof type.name).toBe('string');
      expect(typeof type.accountCode).toBe('string');
      expect(typeof type.renderType).toBe('string');
    });
  });

  test('Accommodation has renderType accommodation', () => {
    const accommodation = EXPENSE_TYPES.find(t => t.name === 'Accommodation');
    expect(accommodation.renderType).toBe('accommodation');
  });

  test('Meals has renderType meal-group with subItems', () => {
    const meals = EXPENSE_TYPES.find(t => t.name === 'Meals');
    expect(meals.renderType).toBe('meal-group');
    expect(meals.subItems).toBeDefined();
    expect(meals.subItems.length).toBe(3);
    expect(meals.subItems[0].name).toBe('Breakfast');
    expect(meals.subItems[1].name).toBe('Lunch');
    expect(meals.subItems[2].name).toBe('Dinner');
  });

  test('Meal sub-items have max amounts', () => {
    const meals = EXPENSE_TYPES.find(t => t.name === 'Meals');
    expect(meals.subItems[0].maxAmount).toBe(30);
    expect(meals.subItems[1].maxAmount).toBe(20);
    expect(meals.subItems[2].maxAmount).toBe(50);
  });

  test('VEHICLE_RATE is the petrol rate (deprecated alias)', () => {
    expect(typeof VEHICLE_RATE).toBe('number');
    expect(VEHICLE_RATE).toBe(VEHICLE_RATES.petrol.rate);
  });

  test('VEHICLE_RATES has all vehicle types', () => {
    expect(VEHICLE_RATES.petrol.rate).toBe(1.17);
    expect(VEHICLE_RATES.diesel.rate).toBe(1.26);
    expect(VEHICLE_RATES.hybrid.rate).toBe(0.86);
    expect(VEHICLE_RATES.electric.rate).toBe(1.08);
  });

  test('DEFAULT_VEHICLE_TYPE is petrol', () => {
    expect(DEFAULT_VEHICLE_TYPE).toBe('petrol');
  });

  test('VEHICLE_ACCOUNT_CODE is defined', () => {
    expect(VEHICLE_ACCOUNT_CODE).toBe('481');
  });

  test('STAFF_ONLY_EXPENSES are defined', () => {
    expect(STAFF_ONLY_EXPENSES.length).toBe(2);
    expect(STAFF_ONLY_EXPENSES[0].name).toBe('Overnight Allowance');
    expect(STAFF_ONLY_EXPENSES[0].renderType).toBe('nights-allowance');
    expect(STAFF_ONLY_EXPENSES[0].ratePerNight).toBe(25);
    expect(STAFF_ONLY_EXPENSES[1].name).toBe('Flu Vaccine');
    expect(STAFF_ONLY_EXPENSES[1].renderType).toBe('standard');
  });
});

describe('getVehicleRate', () => {
  test.each([
    { type: 'petrol', expected: 1.17 },
    { type: 'diesel', expected: 1.26 },
    { type: 'hybrid', expected: 0.86 },
    { type: 'electric', expected: 1.08 },
  ])('returns $expected for $type', ({ type, expected }) => {
    expect(getVehicleRate(type)).toBe(expected);
  });

  test('returns petrol rate for unknown type', () => {
    expect(getVehicleRate('unknown')).toBe(1.17);
  });
});

describe('getVehicleTypeOptions', () => {
  test('returns all vehicle types with labels and rates', () => {
    const options = getVehicleTypeOptions();
    expect(options.length).toBe(4);
    expect(options[0]).toHaveProperty('key');
    expect(options[0]).toHaveProperty('label');
    expect(options[0]).toHaveProperty('rate');
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

  describe('finds meal sub-items', () => {
    test.each([
      { name: 'Breakfast', expectedCode: '484' },
      { name: 'Lunch', expectedCode: '484' },
      { name: 'Dinner', expectedCode: '484' },
    ])('returns sub-item for $name', ({ name, expectedCode }) => {
      const expense = getExpenseByName(name);
      expect(expense).toBeDefined();
      expect(expense.name).toBe(name);
      expect(expense.accountCode).toBe(expectedCode);
    });
  });

  describe('finds staff-only expenses', () => {
    test.each([
      { name: 'Overnight Allowance' },
      { name: 'Flu Vaccine' },
    ])('returns expense for $name', ({ name }) => {
      const expense = getExpenseByName(name);
      expect(expense).toBeDefined();
      expect(expense.name).toBe(name);
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
      { type: 'Breakfast', code: '484' },
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
    { kms: 100, type: 'petrol', expected: 117, desc: '100km petrol' },
    { kms: 100, type: 'diesel', expected: 126, desc: '100km diesel' },
    { kms: 100, type: 'hybrid', expected: 86, desc: '100km hybrid' },
    { kms: 100, type: 'electric', expected: 108, desc: '100km electric' },
    { kms: 0, type: 'petrol', expected: 0, desc: 'zero km' },
  ])('calculates $desc correctly', ({ kms, type, expected }) => {
    expect(calculateVehicleAmount(kms, type)).toBe(expected);
  });

  test('defaults to petrol rate when no type specified', () => {
    expect(calculateVehicleAmount(100)).toBe(117);
  });
});

describe('getExpenseTypeNames', () => {
  test('returns array of expense type names including sub-items', () => {
    const names = getExpenseTypeNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain('Flights');
    expect(names).toContain('Breakfast');
    expect(names).toContain('Lunch');
    expect(names).toContain('Dinner');
    // Meals parent should NOT be in the names list (replaced by sub-items)
    expect(names).not.toContain('Meals');
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
      { type: 'Breakfast' },
      { type: 'Overnight Allowance' },
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
