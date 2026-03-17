/**
 * Expense Types Module
 * Purpose: Define expense categories and their properties
 * Author: James McNeil
 * Date: October 28, 2025
 */

/**
 * Standard expense type definitions with account codes and render types.
 * @type {Array<{name: string, accountCode: string, renderType: string, subItems?: Array, maxNote?: string}>}
 */
export const EXPENSE_TYPES = [
  { name: "Flights", accountCode: "480", renderType: "standard" },
  { name: "Rental Car", accountCode: "486", renderType: "standard" },
  { name: "Fares - Bus/Rail", accountCode: "476", renderType: "standard" },
  { name: "Taxi/Uber", accountCode: "482", renderType: "standard" },
  { name: "Parking", accountCode: "482", renderType: "standard" },
  { name: "Accommodation", accountCode: "484", renderType: "accommodation" },
  {
    name: "Meals",
    accountCode: "484",
    renderType: "meal-group",
    subItems: [
      { name: "Breakfast", accountCode: "484", maxAmount: 30 },
      { name: "Lunch", accountCode: "484", maxAmount: 20 },
      { name: "Dinner", accountCode: "484", maxAmount: 50 }
    ],
    maxNote: "(Maximums GST-inclusive: Breakfast $30, Lunch $20, Dinner $50. Meal limits can be flexed across a full travel day. Alcoholic beverages are not reimbursable)"
  }
];

/**
 * Staff-only expense types, shown only when claimant type is "staff".
 * @type {Array<{name: string, accountCode: string, renderType: string, ratePerNight?: number, note?: string}>}
 */
export const STAFF_ONLY_EXPENSES = [
  { name: "Overnight Allowance", accountCode: "", renderType: "nights-allowance", ratePerNight: 25 },
  { name: "Flu Vaccine", accountCode: "", renderType: "standard", note: "Per Collective Agreement" }
];

/**
 * Private vehicle reimbursement rates by vehicle type (NZD per kilometre).
 * @type {Object<string, {label: string, rate: number}>}
 */
export const VEHICLE_RATES = {
  petrol: { label: "Petrol", rate: 1.17 },
  diesel: { label: "Diesel", rate: 1.26 },
  hybrid: { label: "Hybrid", rate: 0.86 },
  electric: { label: "Electric", rate: 1.08 }
};

/**
 * Default vehicle type key.
 * @type {string}
 */
export const DEFAULT_VEHICLE_TYPE = "petrol";

/**
 * Private vehicle reimbursement rate (NZD per kilometre).
 * @deprecated Use VEHICLE_RATES instead
 * @type {number}
 */
export const VEHICLE_RATE = VEHICLE_RATES[DEFAULT_VEHICLE_TYPE].rate;

/**
 * Private vehicle account code.
 * @type {string}
 */
export const VEHICLE_ACCOUNT_CODE = "481";

/**
 * Gets the rate for a given vehicle type.
 * @param {string} vehicleType - Vehicle type key (petrol, diesel, hybrid, electric)
 * @returns {number} The rate per kilometre
 */
export function getVehicleRate(vehicleType) {
  const entry = VEHICLE_RATES[vehicleType];
  return entry ? entry.rate : VEHICLE_RATES[DEFAULT_VEHICLE_TYPE].rate;
}

/**
 * Gets all vehicle type labels for dropdown display.
 * @returns {Array<{key: string, label: string, rate: number}>}
 */
export function getVehicleTypeOptions() {
  return Object.entries(VEHICLE_RATES).map(([key, { label, rate }]) => ({
    key, label, rate
  }));
}

/**
 * Gets an expense type by its name, including sub-items of meal groups.
 * @param {string} name - The expense type name
 * @returns {object|undefined} The expense type object or undefined if not found
 */
export function getExpenseByName(name) {
  // Check top-level types
  const found = EXPENSE_TYPES.find(t => t.name === name);
  if (found) return found;

  // Check sub-items (e.g. Breakfast, Lunch, Dinner)
  for (const type of EXPENSE_TYPES) {
    if (type.subItems) {
      const sub = type.subItems.find(s => s.name === name);
      if (sub) return sub;
    }
  }

  // Check staff-only expenses
  return STAFF_ONLY_EXPENSES.find(t => t.name === name);
}

/**
 * Gets the account code for an expense type by name.
 * @param {string} name - The expense type name
 * @returns {string} The account code or empty string if not found
 */
export function getAccountCode(name) {
  const expense = getExpenseByName(name);
  return expense ? expense.accountCode : "";
}

/**
 * Calculates the vehicle reimbursement amount.
 * @param {number} kilometres - Number of kilometres driven
 * @param {string} [vehicleType] - Vehicle type key (defaults to petrol)
 * @returns {number} The calculated reimbursement amount
 */
export function calculateVehicleAmount(kilometres, vehicleType = DEFAULT_VEHICLE_TYPE) {
  const rate = getVehicleRate(vehicleType);
  return kilometres * rate;
}

/**
 * Gets all expense type names, including sub-items.
 * @returns {Array<string>} Array of expense type names
 */
export function getExpenseTypeNames() {
  const names = [];
  EXPENSE_TYPES.forEach(t => {
    if (t.subItems) {
      t.subItems.forEach(s => names.push(s.name));
    } else {
      names.push(t.name);
    }
  });
  return names;
}

/**
 * Validates if a given name is a valid expense type.
 * @param {string} name - The expense type name to validate
 * @returns {boolean} True if valid expense type
 */
export function isValidExpenseType(name) {
  return !!getExpenseByName(name);
}
