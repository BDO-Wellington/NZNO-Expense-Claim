/**
 * Expense Types Module
 * Purpose: Define expense categories and their properties
 * Author: James McNeil
 * Date: October 28, 2025
 */

/**
 * Standard expense type definitions with account codes.
 * @type {Array<{name: string, accountCode: string}>}
 */
export const EXPENSE_TYPES = [
  { name: "Flights", accountCode: "480" },
  { name: "Rental Car", accountCode: "486" },
  { name: "Fares - Bus/Rail", accountCode: "476" },
  { name: "Taxi/Uber", accountCode: "482" },
  { name: "Parking", accountCode: "482" },
  { name: "Accommodation", accountCode: "484" },
  { name: "Meals", accountCode: "484" }
];

/**
 * Private vehicle reimbursement rate (NZD per kilometre).
 * @type {number}
 */
export const VEHICLE_RATE = 1.04;

/**
 * Private vehicle account code.
 * @type {string}
 */
export const VEHICLE_ACCOUNT_CODE = "481";

/**
 * Gets an expense type by its name.
 * @param {string} name - The expense type name
 * @returns {object|undefined} The expense type object or undefined if not found
 */
export function getExpenseByName(name) {
  return EXPENSE_TYPES.find(t => t.name === name);
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
 * @returns {number} The calculated reimbursement amount
 */
export function calculateVehicleAmount(kilometres) {
  return kilometres * VEHICLE_RATE;
}

/**
 * Gets all expense type names.
 * @returns {Array<string>} Array of expense type names
 */
export function getExpenseTypeNames() {
  return EXPENSE_TYPES.map(t => t.name);
}

/**
 * Validates if a given name is a valid expense type.
 * @param {string} name - The expense type name to validate
 * @returns {boolean} True if valid expense type
 */
export function isValidExpenseType(name) {
  return EXPENSE_TYPES.some(t => t.name === name);
}
