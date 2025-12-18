/**
 * Modal Module Tests
 * Tests for modal dialog exports and configuration
 * 
 * Note: Full DOM interaction tests require happy-dom or jsdom.
 * These tests verify exports, configuration, and initial state.
 */

import { describe, test, expect } from 'bun:test';
import {
  showConfirmModal,
  showDeleteConfirm,
  showWarningModal,
  isModalOpen,
  forceCloseModal,
  MODAL_CONFIG
} from '../modal.js';

describe('Modal Module', () => {
  describe('Exports', () => {
    test('should export showConfirmModal function', () => {
      expect(typeof showConfirmModal).toBe('function');
    });

    test('should export showDeleteConfirm function', () => {
      expect(typeof showDeleteConfirm).toBe('function');
    });

    test('should export showWarningModal function', () => {
      expect(typeof showWarningModal).toBe('function');
    });

    test('should export isModalOpen function', () => {
      expect(typeof isModalOpen).toBe('function');
    });

    test('should export forceCloseModal function', () => {
      expect(typeof forceCloseModal).toBe('function');
    });

    test('should export MODAL_CONFIG object', () => {
      expect(typeof MODAL_CONFIG).toBe('object');
    });
  });

  describe('MODAL_CONFIG', () => {
    test('should have ANIMATION_DURATION property', () => {
      expect(MODAL_CONFIG.ANIMATION_DURATION).toBeDefined();
    });

    test('ANIMATION_DURATION should be 200ms', () => {
      expect(MODAL_CONFIG.ANIMATION_DURATION).toBe(200);
    });

    test('ANIMATION_DURATION should be a number', () => {
      expect(typeof MODAL_CONFIG.ANIMATION_DURATION).toBe('number');
    });

    test('ANIMATION_DURATION should be positive', () => {
      expect(MODAL_CONFIG.ANIMATION_DURATION).toBeGreaterThan(0);
    });

    test('ANIMATION_DURATION should be reasonable (less than 1 second)', () => {
      expect(MODAL_CONFIG.ANIMATION_DURATION).toBeLessThan(1000);
    });
  });

  describe('isModalOpen initial state', () => {
    test('should return boolean', () => {
      const result = isModalOpen();
      expect(typeof result).toBe('boolean');
    });

    test('should return false initially', () => {
      expect(isModalOpen()).toBe(false);
    });
  });

  describe('forceCloseModal safety', () => {
    test('should not throw when no modal is open', () => {
      expect(() => forceCloseModal()).not.toThrow();
    });

    test('should return undefined', () => {
      const result = forceCloseModal();
      expect(result).toBeUndefined();
    });

    test('should be idempotent (callable multiple times)', () => {
      expect(() => {
        forceCloseModal();
        forceCloseModal();
        forceCloseModal();
      }).not.toThrow();
    });
  });

  describe('Function arity', () => {
    test('showConfirmModal should accept 1 argument', () => {
      expect(showConfirmModal.length).toBeLessThanOrEqual(1);
    });

    test('showDeleteConfirm should accept 0-1 arguments', () => {
      expect(showDeleteConfirm.length).toBeLessThanOrEqual(1);
    });

    test('showWarningModal should accept 2 arguments', () => {
      expect(showWarningModal.length).toBeLessThanOrEqual(2);
    });

    test('isModalOpen should accept 0 arguments', () => {
      expect(isModalOpen.length).toBe(0);
    });

    test('forceCloseModal should accept 0 arguments', () => {
      expect(forceCloseModal.length).toBe(0);
    });
  });
});
