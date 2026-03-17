/**
 * Claimant Type Module
 * Purpose: Handle claimant type toggle (Staff/Member) and conditional field visibility
 * Date: March 2026
 */

/**
 * Valid claimant types.
 * @type {Array<string>}
 */
export const CLAIMANT_TYPES = ['member', 'staff'];

/**
 * Default claimant type.
 * @type {string}
 */
export const DEFAULT_CLAIMANT_TYPE = 'member';

/**
 * Gets the currently selected claimant type from the radio buttons.
 * @returns {string} The selected claimant type ('member' or 'staff')
 */
export function getClaimantType() {
  const checked = document.querySelector('input[name="claimantType"]:checked');
  return checked ? checked.value : DEFAULT_CLAIMANT_TYPE;
}

/**
 * Applies visibility rules based on the selected claimant type.
 * Shows/hides conditional field sections using the d-none class.
 * @param {string} type - The claimant type
 * @returns {void}
 */
export function applyClaimantTypeVisibility(type) {
  const memberFields = document.getElementById('memberFields');
  const staffFields = document.getElementById('staffFields');
  const otherFields = document.getElementById('otherFields');

  // Hide all conditional sections first
  if (memberFields) memberFields.classList.add('d-none');
  if (staffFields) staffFields.classList.add('d-none');
  if (otherFields) otherFields.classList.add('d-none');

  // Show relevant section
  switch (type) {
    case 'member':
      if (memberFields) memberFields.classList.remove('d-none');
      break;
    case 'staff':
      if (staffFields) staffFields.classList.remove('d-none');
      break;
  }
}

/**
 * Sets up the claimant type radio button toggle.
 * @param {function} onTypeChange - Callback invoked with the new claimant type when selection changes
 * @returns {void}
 */
export function setupClaimantTypeToggle(onTypeChange) {
  const radios = document.querySelectorAll('input[name="claimantType"]');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const type = radio.value;
      applyClaimantTypeVisibility(type);
      if (onTypeChange) {
        onTypeChange(type);
      }
    });
  });

  // Apply initial visibility based on default/checked value
  applyClaimantTypeVisibility(getClaimantType());
}
