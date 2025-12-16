/**
 * Config Loader Module Tests
 */
import { describe, expect, test } from 'bun:test';
import {
  validateConfig,
  getConfigValue,
  isDebugMode,
  shouldSubmitIndividually,
  shouldStringifyLineItems,
} from '../config-loader.js';

describe('validateConfig', () => {
  test('accepts valid configuration', () => {
    const config = {
      API_URL: 'https://api.example.com/submit',
      DEBUG_MODE: 'PRODUCTION',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  test('throws on missing API_URL', () => {
    const config = {
      DEBUG_MODE: 'PRODUCTION',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).toThrow('Missing required configuration field: API_URL');
  });

  test('throws on missing DEBUG_MODE', () => {
    const config = {
      API_URL: 'https://api.example.com',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).toThrow('Missing required configuration field: DEBUG_MODE');
  });

  test('throws on missing SUBMIT_INDIVIDUAL_LINE_ITEMS', () => {
    const config = {
      API_URL: 'https://api.example.com',
      DEBUG_MODE: 'PRODUCTION'
    };
    expect(() => validateConfig(config)).toThrow('Missing required configuration field: SUBMIT_INDIVIDUAL_LINE_ITEMS');
  });

  test('throws on empty API_URL', () => {
    const config = {
      API_URL: '',
      DEBUG_MODE: 'PRODUCTION',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).toThrow('API_URL must be a non-empty string');
  });

  test('throws on invalid DEBUG_MODE', () => {
    const config = {
      API_URL: 'https://api.example.com',
      DEBUG_MODE: 'INVALID',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).toThrow('DEBUG_MODE must be either "DEBUG" or "PRODUCTION"');
  });

  test('accepts DEBUG mode (case insensitive)', () => {
    const config = {
      API_URL: 'https://api.example.com',
      DEBUG_MODE: 'debug',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  test('normalizes string boolean for SUBMIT_INDIVIDUAL_LINE_ITEMS', () => {
    const config = {
      API_URL: 'https://api.example.com',
      DEBUG_MODE: 'PRODUCTION',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: 'true'
    };
    validateConfig(config);
    expect(config.SUBMIT_INDIVIDUAL_LINE_ITEMS).toBe(true);
  });

  test('sets default STRINGIFY_LINE_ITEMS_FOR_ZAPIER to true', () => {
    const config = {
      API_URL: 'https://api.example.com',
      DEBUG_MODE: 'PRODUCTION',
      SUBMIT_INDIVIDUAL_LINE_ITEMS: false
    };
    validateConfig(config);
    expect(config.STRINGIFY_LINE_ITEMS_FOR_ZAPIER).toBe(true);
  });
});

describe('getConfigValue', () => {
  test('returns value for existing key', () => {
    const config = { API_URL: 'https://example.com', DEBUG_MODE: 'DEBUG' };
    expect(getConfigValue(config, 'API_URL')).toBe('https://example.com');
  });

  test('returns default value for missing key', () => {
    const config = { API_URL: 'https://example.com' };
    expect(getConfigValue(config, 'MISSING_KEY', 'default')).toBe('default');
  });

  test('returns null as default when no default provided', () => {
    const config = { API_URL: 'https://example.com' };
    expect(getConfigValue(config, 'MISSING_KEY')).toBeNull();
  });

  test('returns default for null config', () => {
    expect(getConfigValue(null, 'API_URL', 'default')).toBe('default');
  });

  test('returns default for non-object config', () => {
    expect(getConfigValue('string', 'API_URL', 'default')).toBe('default');
  });

  test('returns falsy values correctly', () => {
    const config = { emptyString: '', zero: 0, falseValue: false };
    expect(getConfigValue(config, 'emptyString', 'default')).toBe('');
    expect(getConfigValue(config, 'zero', 99)).toBe(0);
    expect(getConfigValue(config, 'falseValue', true)).toBe(false);
  });
});

describe('isDebugMode', () => {
  test('returns true for DEBUG mode', () => {
    expect(isDebugMode({ DEBUG_MODE: 'DEBUG' })).toBe(true);
  });

  test('returns true for debug mode (lowercase)', () => {
    expect(isDebugMode({ DEBUG_MODE: 'debug' })).toBe(true);
  });

  test('returns false for PRODUCTION mode', () => {
    expect(isDebugMode({ DEBUG_MODE: 'PRODUCTION' })).toBe(false);
  });

  test('returns false for missing DEBUG_MODE', () => {
    expect(isDebugMode({})).toBe(false);
  });

  test('returns false for null config', () => {
    expect(isDebugMode(null)).toBe(false);
  });
});

describe('shouldSubmitIndividually', () => {
  test('returns true when enabled', () => {
    expect(shouldSubmitIndividually({ SUBMIT_INDIVIDUAL_LINE_ITEMS: true })).toBe(true);
  });

  test('returns false when disabled', () => {
    expect(shouldSubmitIndividually({ SUBMIT_INDIVIDUAL_LINE_ITEMS: false })).toBe(false);
  });

  test('handles string true', () => {
    expect(shouldSubmitIndividually({ SUBMIT_INDIVIDUAL_LINE_ITEMS: 'true' })).toBe(true);
  });

  test('returns false for missing config', () => {
    expect(shouldSubmitIndividually({})).toBe(false);
  });

  test('returns false for null config', () => {
    expect(shouldSubmitIndividually(null)).toBe(false);
  });
});

describe('shouldStringifyLineItems', () => {
  test('returns true when enabled', () => {
    expect(shouldStringifyLineItems({ STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true })).toBe(true);
  });

  test('returns false when disabled', () => {
    expect(shouldStringifyLineItems({ STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false })).toBe(false);
  });

  test('returns true as default when missing', () => {
    expect(shouldStringifyLineItems({})).toBe(true);
  });

  test('returns true for null config', () => {
    expect(shouldStringifyLineItems(null)).toBe(true);
  });
});
