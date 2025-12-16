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
  const validConfig = {
    API_URL: 'https://api.example.com/submit',
    DEBUG_MODE: 'PRODUCTION',
    SUBMIT_INDIVIDUAL_LINE_ITEMS: false
  };

  test('accepts valid configuration', () => {
    expect(() => validateConfig({ ...validConfig })).not.toThrow();
  });

  describe('missing required fields', () => {
    test.each([
      { field: 'API_URL', config: { DEBUG_MODE: 'PRODUCTION', SUBMIT_INDIVIDUAL_LINE_ITEMS: false } },
      { field: 'DEBUG_MODE', config: { API_URL: 'https://api.example.com', SUBMIT_INDIVIDUAL_LINE_ITEMS: false } },
      { field: 'SUBMIT_INDIVIDUAL_LINE_ITEMS', config: { API_URL: 'https://api.example.com', DEBUG_MODE: 'PRODUCTION' } },
    ])('throws on missing $field', ({ field, config }) => {
      expect(() => validateConfig(config)).toThrow(`Missing required configuration field: ${field}`);
    });
  });

  test('throws on empty API_URL', () => {
    const config = { ...validConfig, API_URL: '' };
    expect(() => validateConfig(config)).toThrow('API_URL must be a non-empty string');
  });

  describe('DEBUG_MODE validation', () => {
    test.each([
      { mode: 'DEBUG', shouldPass: true },
      { mode: 'debug', shouldPass: true },
      { mode: 'PRODUCTION', shouldPass: true },
      { mode: 'production', shouldPass: true },
      { mode: 'INVALID', shouldPass: false },
      { mode: 'test', shouldPass: false },
    ])('$mode -> $shouldPass', ({ mode, shouldPass }) => {
      const config = { ...validConfig, DEBUG_MODE: mode };
      if (shouldPass) {
        expect(() => validateConfig(config)).not.toThrow();
      } else {
        expect(() => validateConfig(config)).toThrow('DEBUG_MODE must be either "DEBUG" or "PRODUCTION"');
      }
    });
  });

  describe('boolean normalization', () => {
    test.each([
      { input: 'true', expected: true },
      { input: 'false', expected: false },
      { input: true, expected: true },
      { input: false, expected: false },
    ])('SUBMIT_INDIVIDUAL_LINE_ITEMS: $input -> $expected', ({ input, expected }) => {
      const config = { ...validConfig, SUBMIT_INDIVIDUAL_LINE_ITEMS: input };
      validateConfig(config);
      expect(config.SUBMIT_INDIVIDUAL_LINE_ITEMS).toBe(expected);
    });
  });

  test('sets default STRINGIFY_LINE_ITEMS_FOR_ZAPIER to true', () => {
    const config = { ...validConfig };
    validateConfig(config);
    expect(config.STRINGIFY_LINE_ITEMS_FOR_ZAPIER).toBe(true);
  });
});

describe('getConfigValue', () => {
  describe('returns value for existing keys', () => {
    test.each([
      { config: { API_URL: 'https://example.com' }, key: 'API_URL', expected: 'https://example.com' },
      { config: { DEBUG_MODE: 'DEBUG' }, key: 'DEBUG_MODE', expected: 'DEBUG' },
      { config: { count: 42 }, key: 'count', expected: 42 },
    ])('$key -> $expected', ({ config, key, expected }) => {
      expect(getConfigValue(config, key)).toBe(expected);
    });
  });

  describe('returns default for missing/invalid config', () => {
    test.each([
      { config: {}, key: 'MISSING', defaultVal: 'default', expected: 'default' },
      { config: null, key: 'API_URL', defaultVal: 'default', expected: 'default' },
      { config: 'string', key: 'API_URL', defaultVal: 'default', expected: 'default' },
      { config: undefined, key: 'API_URL', defaultVal: 'fallback', expected: 'fallback' },
    ])('returns $expected for $config', ({ config, key, defaultVal, expected }) => {
      expect(getConfigValue(config, key, defaultVal)).toBe(expected);
    });
  });

  test('returns null as default when no default provided', () => {
    expect(getConfigValue({}, 'MISSING_KEY')).toBeNull();
  });

  describe('returns falsy values correctly', () => {
    test.each([
      { key: 'emptyString', value: '', defaultVal: 'default' },
      { key: 'zero', value: 0, defaultVal: 99 },
      { key: 'falseValue', value: false, defaultVal: true },
    ])('$key: $value (not $defaultVal)', ({ key, value, defaultVal }) => {
      const config = { [key]: value };
      expect(getConfigValue(config, key, defaultVal)).toBe(value);
    });
  });
});

describe('isDebugMode', () => {
  test.each([
    { config: { DEBUG_MODE: 'DEBUG' }, expected: true, desc: 'DEBUG uppercase' },
    { config: { DEBUG_MODE: 'debug' }, expected: true, desc: 'debug lowercase' },
    { config: { DEBUG_MODE: 'PRODUCTION' }, expected: false, desc: 'PRODUCTION mode' },
    { config: {}, expected: false, desc: 'missing DEBUG_MODE' },
    { config: null, expected: false, desc: 'null config' },
  ])('returns $expected for $desc', ({ config, expected }) => {
    expect(isDebugMode(config)).toBe(expected);
  });
});

describe('shouldSubmitIndividually', () => {
  test.each([
    { config: { SUBMIT_INDIVIDUAL_LINE_ITEMS: true }, expected: true, desc: 'boolean true' },
    { config: { SUBMIT_INDIVIDUAL_LINE_ITEMS: false }, expected: false, desc: 'boolean false' },
    { config: { SUBMIT_INDIVIDUAL_LINE_ITEMS: 'true' }, expected: true, desc: 'string true' },
    { config: {}, expected: false, desc: 'missing field' },
    { config: null, expected: false, desc: 'null config' },
  ])('returns $expected for $desc', ({ config, expected }) => {
    expect(shouldSubmitIndividually(config)).toBe(expected);
  });
});

describe('shouldStringifyLineItems', () => {
  test.each([
    { config: { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true }, expected: true, desc: 'enabled' },
    { config: { STRINGIFY_LINE_ITEMS_FOR_ZAPIER: false }, expected: false, desc: 'disabled' },
    { config: {}, expected: true, desc: 'missing (defaults true)' },
    { config: null, expected: true, desc: 'null config (defaults true)' },
  ])('returns $expected when $desc', ({ config, expected }) => {
    expect(shouldStringifyLineItems(config)).toBe(expected);
  });
});
