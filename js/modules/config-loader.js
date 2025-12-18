/**
 * Configuration Loader Module
 * Purpose: Load and validate application configuration
 * Author: James McNeil
 * Date: October 28, 2025
 */

/**
 * Loads the configuration from config.json.
 * @returns {Promise<object>} Configuration object
 * @throws {Error} If config fails to load or is invalid
 */
export async function loadConfig() {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to load config.json: HTTP ${response.status}`);
    }
    
    const config = await response.json();
    
    if (!config) {
      throw new Error('Configuration is empty');
    }
    
    // Validate required fields
    validateConfig(config);
    
    return config;
  } catch (error) {
    console.error('[ExpenseClaim] Config loading error:', error);
    throw error;
  }
}

/**
 * Validates the configuration object.
 * @param {object} config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 * @returns {void}
 */
export function validateConfig(config) {
  const requiredFields = ['API_URL', 'DEBUG_MODE', 'SUBMIT_INDIVIDUAL_LINE_ITEMS'];

  for (const field of requiredFields) {
    if (!(field in config)) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }

  // Validate API_URL format
  if (typeof config.API_URL !== 'string' || config.API_URL.trim() === '') {
    throw new Error('API_URL must be a non-empty string');
  }

  // Validate DEBUG_MODE
  const validDebugModes = ['DEBUG', 'PRODUCTION'];
  if (typeof config.DEBUG_MODE !== 'string' ||
      !validDebugModes.includes(config.DEBUG_MODE.toUpperCase())) {
    throw new Error('DEBUG_MODE must be either "DEBUG" or "PRODUCTION"');
  }

  // Normalize boolean values
  config.SUBMIT_INDIVIDUAL_LINE_ITEMS = parseBooleanConfig(config.SUBMIT_INDIVIDUAL_LINE_ITEMS);

  // Set default for STRINGIFY_LINE_ITEMS_FOR_ZAPIER if not present
  if (!('STRINGIFY_LINE_ITEMS_FOR_ZAPIER' in config)) {
    config.STRINGIFY_LINE_ITEMS_FOR_ZAPIER = true; // Default to true for Xero compatibility
  } else {
    config.STRINGIFY_LINE_ITEMS_FOR_ZAPIER = parseBooleanConfig(config.STRINGIFY_LINE_ITEMS_FOR_ZAPIER);
  }
}

/**
 * Parses a configuration value as a boolean.
 * @param {any} value - Value to parse
 * @returns {boolean} Parsed boolean value
 */
function parseBooleanConfig(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

/**
 * Shows a configuration error to the user.
 * @param {Error} error - The error that occurred
 * @returns {void}
 */
export function showConfigError(error) {
  document.body.innerHTML = `
    <div class="container mt-5">
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Configuration Error</h4>
        <p>Failed to load application configuration.</p>
        <hr>
        <p class="mb-0">Please contact support or check the browser console for details.</p>
      </div>
    </div>
  `;
  console.error('[ExpenseClaim] Configuration error:', error);
}

/**
 * Gets the configuration value with type checking.
 * @param {object} config - Configuration object
 * @param {string} key - Configuration key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Configuration value or default
 */
export function getConfigValue(config, key, defaultValue = null) {
  if (!config || typeof config !== 'object') {
    return defaultValue;
  }
  return key in config ? config[key] : defaultValue;
}

/**
 * Checks if application is in debug mode.
 * @param {object} config - Configuration object
 * @returns {boolean} True if in debug mode
 */
export function isDebugMode(config) {
  const debugMode = getConfigValue(config, 'DEBUG_MODE', 'PRODUCTION');
  return typeof debugMode === 'string' && debugMode.toUpperCase() === 'DEBUG';
}

/**
 * Checks if individual line item submission is enabled.
 * @param {object} config - Configuration object
 * @returns {boolean} True if individual submission is enabled
 */
export function shouldSubmitIndividually(config) {
  return parseBooleanConfig(getConfigValue(config, 'SUBMIT_INDIVIDUAL_LINE_ITEMS', false));
}

/**
 * Checks if line items should be sent as JSON string (for Zapier Code actions).
 * @param {object} config - Configuration object
 * @returns {boolean} True if line items should be stringified
 */
export function shouldStringifyLineItems(config) {
  return parseBooleanConfig(getConfigValue(config, 'STRINGIFY_LINE_ITEMS_FOR_ZAPIER', true));
}

/**
 * Gets the effective API URL based on DEBUG_MODE.
 * Uses API_URL_MOCK when not in production, API_URL otherwise.
 * @param {object} config - Configuration object
 * @returns {string} The API URL to use
 */
export function getEffectiveApiUrl(config) {
  const isProduction = !isDebugMode(config);

  if (isProduction) {
    return getConfigValue(config, 'API_URL', '');
  }

  // In debug/dev mode, prefer API_URL_MOCK if available
  const mockUrl = getConfigValue(config, 'API_URL_MOCK', null);
  if (mockUrl && mockUrl.trim() !== '') {
    return mockUrl;
  }

  // Fall back to API_URL if no mock URL configured
  return getConfigValue(config, 'API_URL', '');
}
