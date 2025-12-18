/**
 * Modal Module Tests
 * Tests for modal dialog exports, configuration, and behavioral tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { resetAllMocks } from '../../../tests/setup.js';
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

  describe('Modal Behavior', () => {
    beforeEach(() => {
      resetAllMocks();
      // Ensure no modal is open before each test
      forceCloseModal();
    });

    afterEach(() => {
      // Clean up any open modals
      forceCloseModal();
    });

    test('showConfirmModal creates modal element in DOM', async () => {
      // Start showing the modal (don't await - we want to inspect DOM while open)
      const modalPromise = showConfirmModal({
        title: 'Test Modal',
        message: 'Test message'
      });

      // Modal should be open
      expect(isModalOpen()).toBe(true);

      // Find the modal in the DOM
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).not.toBeNull();

      // Clean up
      forceCloseModal();
      await modalPromise.catch(() => {}); // Ignore rejection from force close
    });

    test('confirm button resolves promise with true', async () => {
      const modalPromise = showConfirmModal({
        title: 'Confirm Action',
        message: 'Are you sure?',
        confirmText: 'Yes',
        cancelText: 'No'
      });

      // Find and click the confirm button
      const confirmBtn = document.querySelector('.modal-confirm');
      expect(confirmBtn).not.toBeNull();
      confirmBtn.click();

      // Promise should resolve with true
      const result = await modalPromise;
      expect(result).toBe(true);
    });

    test('cancel button resolves promise with false', async () => {
      const modalPromise = showConfirmModal({
        title: 'Confirm Action',
        message: 'Are you sure?'
      });

      // Find and click the cancel button
      const cancelBtn = document.querySelector('.modal-cancel');
      expect(cancelBtn).not.toBeNull();
      cancelBtn.click();

      // Promise should resolve with false
      const result = await modalPromise;
      expect(result).toBe(false);
    });

    test('clicking backdrop closes modal and resolves false', async () => {
      const modalPromise = showConfirmModal({
        title: 'Test',
        message: 'Click outside to close'
      });

      // Find the backdrop and simulate click on it (not on content)
      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).not.toBeNull();

      // Create a click event on the backdrop itself (not bubbled from content)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: backdrop });
      backdrop.dispatchEvent(clickEvent);

      // Promise should resolve with false
      const result = await modalPromise;
      expect(result).toBe(false);
    });

    test('ESC key closes modal and resolves false', async () => {
      const modalPromise = showConfirmModal({
        title: 'Test',
        message: 'Press ESC to close'
      });

      // Dispatch ESC key event
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escEvent);

      // Promise should resolve with false
      const result = await modalPromise;
      expect(result).toBe(false);
    });

    test('opening new modal closes existing modal', async () => {
      // Open first modal
      const firstModalPromise = showConfirmModal({
        title: 'First Modal',
        message: 'This should close'
      });

      expect(isModalOpen()).toBe(true);

      // Open second modal
      const secondModalPromise = showConfirmModal({
        title: 'Second Modal',
        message: 'This is the new modal'
      });

      // First modal should resolve with false (was closed by second modal opening)
      const firstResult = await firstModalPromise;
      expect(firstResult).toBe(false);

      // Close second modal
      forceCloseModal();
      await secondModalPromise.catch(() => {});
    });

    test('showDeleteConfirm uses danger type styling', async () => {
      const modalPromise = showDeleteConfirm('test item');

      // Check that the modal has danger styling
      const confirmBtn = document.querySelector('.modal-confirm');
      expect(confirmBtn).not.toBeNull();
      expect(confirmBtn.classList.contains('btn-danger')).toBe(true);

      // Check for warning icon
      const warningIcon = document.querySelector('.modal-warning-icon');
      expect(warningIcon).not.toBeNull();

      // Clean up
      forceCloseModal();
      await modalPromise.catch(() => {});
    });

    test('modal prevents body scroll while open', async () => {
      const originalOverflow = document.body.style.overflow;

      const modalPromise = showConfirmModal({
        title: 'Test',
        message: 'Check scroll lock'
      });

      // Body should have overflow hidden
      expect(document.body.style.overflow).toBe('hidden');

      // Close modal
      forceCloseModal();
      await modalPromise.catch(() => {});

      // After animation, overflow should be restored
      await new Promise(resolve => setTimeout(resolve, MODAL_CONFIG.ANIMATION_DURATION + 50));
      expect(document.body.style.overflow).toBe(originalOverflow || '');
    });

    test('modal has correct accessibility attributes', async () => {
      const modalPromise = showConfirmModal({
        title: 'Accessible Modal',
        message: 'Testing accessibility'
      });

      const modal = document.querySelector('.modal-backdrop');
      expect(modal).not.toBeNull();

      // Check ARIA attributes
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');
      expect(modal.getAttribute('aria-describedby')).toBe('modal-message');

      // Check title and message have correct IDs
      const title = modal.querySelector('#modal-title');
      const message = modal.querySelector('#modal-message');
      expect(title).not.toBeNull();
      expect(message).not.toBeNull();

      // Clean up
      forceCloseModal();
      await modalPromise.catch(() => {});
    });

    test('modal displays custom button text', async () => {
      const modalPromise = showConfirmModal({
        title: 'Custom Buttons',
        message: 'Test',
        confirmText: 'Do It',
        cancelText: 'Never Mind'
      });

      const confirmBtn = document.querySelector('.modal-confirm');
      const cancelBtn = document.querySelector('.modal-cancel');

      expect(confirmBtn.textContent).toBe('Do It');
      expect(cancelBtn.textContent).toBe('Never Mind');

      // Clean up
      forceCloseModal();
      await modalPromise.catch(() => {});
    });
  });
});
