/**
 * Toast Module Tests
 * Tests for toast notification functionality
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  showToast,
  dismissToast,
  dismissAllToasts,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  getActiveToastCount,
  resetToasts,
  TOAST_CONFIG
} from '../toast.js';

describe('Toast Module', () => {
  beforeEach(() => {
    // Reset DOM and toasts before each test
    document.body.innerHTML = '';
    resetToasts();
  });

  afterEach(() => {
    // Clean up after each test
    resetToasts();
  });

  describe('showToast', () => {
    test('should create and show a toast notification', () => {
      const toast = showToast('Test message', 'info');

      expect(toast).toBeDefined();
      expect(toast.classList.contains('toast')).toBe(true);
      expect(toast.classList.contains('toast-info')).toBe(true);
    });

    test('should add toast to container', () => {
      showToast('Test message', 'info');

      const container = document.getElementById('toast-container');
      expect(container).toBeDefined();
      expect(container.children.length).toBe(1);
    });

    test('should display the message text', () => {
      showToast('Hello World', 'success');

      const messageEl = document.querySelector('.toast-message');
      expect(messageEl.textContent).toBe('Hello World');
    });

    test('should create toast container with aria-live attribute', () => {
      showToast('Test', 'info');

      const container = document.getElementById('toast-container');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    test('should set role="alert" on toast', () => {
      const toast = showToast('Test', 'info');

      expect(toast.getAttribute('role')).toBe('alert');
    });

    test('should add progress bar for auto-dismiss toasts', () => {
      const toast = showToast('Test', 'success', { duration: 5000 });

      const progressBar = toast.querySelector('.toast-progress-bar');
      expect(progressBar).toBeDefined();
    });

    test('should not add progress bar when duration is 0', () => {
      const toast = showToast('Test', 'error', { duration: 0 });

      const progressBar = toast.querySelector('.toast-progress-bar');
      expect(progressBar).toBeNull();
    });

    test('should increment active toast count', () => {
      expect(getActiveToastCount()).toBe(0);

      showToast('Test 1', 'info');
      expect(getActiveToastCount()).toBe(1);

      showToast('Test 2', 'info');
      expect(getActiveToastCount()).toBe(2);
    });

    test('should limit toasts to MAX_TOASTS', () => {
      for (let i = 0; i < TOAST_CONFIG.MAX_TOASTS + 2; i++) {
        showToast(`Toast ${i}`, 'info');
      }

      expect(getActiveToastCount()).toBeLessThanOrEqual(TOAST_CONFIG.MAX_TOASTS);
    });
  });

  describe('Toast types', () => {
    test('should create success toast with correct class', () => {
      const toast = showSuccess('Success message');

      expect(toast.classList.contains('toast-success')).toBe(true);
    });

    test('should create error toast with correct class', () => {
      const toast = showError('Error message');

      expect(toast.classList.contains('toast-error')).toBe(true);
    });

    test('should create warning toast with correct class', () => {
      const toast = showWarning('Warning message');

      expect(toast.classList.contains('toast-warning')).toBe(true);
    });

    test('should create info toast with correct class', () => {
      const toast = showInfo('Info message');

      expect(toast.classList.contains('toast-info')).toBe(true);
    });
  });

  describe('dismissToast', () => {
    test('should remove toast from active count', () => {
      const toast = showToast('Test', 'info');
      expect(getActiveToastCount()).toBe(1);

      dismissToast(toast);

      // After animation would complete
      expect(getActiveToastCount()).toBe(0);
    });

    test('should add hiding class to toast', () => {
      const toast = showToast('Test', 'info');

      dismissToast(toast);

      expect(toast.classList.contains('toast-hiding')).toBe(true);
    });

    test('should handle null toast gracefully', () => {
      expect(() => dismissToast(null)).not.toThrow();
    });
  });

  describe('dismissAllToasts', () => {
    test('should dismiss all active toasts', () => {
      showToast('Test 1', 'info');
      showToast('Test 2', 'success');
      showToast('Test 3', 'warning');

      expect(getActiveToastCount()).toBe(3);

      dismissAllToasts();

      expect(getActiveToastCount()).toBe(0);
    });
  });

  describe('resetToasts', () => {
    test('should remove toast container from DOM', () => {
      showToast('Test', 'info');

      expect(document.getElementById('toast-container')).toBeDefined();

      resetToasts();

      expect(document.getElementById('toast-container')).toBeNull();
    });
  });

  describe('Close button', () => {
    test('should have a close button', () => {
      const toast = showToast('Test', 'info');

      const closeBtn = toast.querySelector('.toast-close');
      expect(closeBtn).toBeDefined();
    });

    test('should have accessible close button', () => {
      const toast = showToast('Test', 'info');

      const closeBtn = toast.querySelector('.toast-close');
      expect(closeBtn.getAttribute('aria-label')).toBe('Dismiss notification');
    });
  });

  describe('Custom duration', () => {
    test('should accept custom duration option', () => {
      const toast = showToast('Test', 'info', { duration: 10000 });

      const progressBar = toast.querySelector('.toast-progress-bar');
      expect(progressBar.style.animationDuration).toBe('10000ms');
    });
  });

  describe('XSS prevention', () => {
    test('should escape HTML in message', () => {
      showToast('<script>alert("xss")</script>', 'info');

      const messageEl = document.querySelector('.toast-message');
      expect(messageEl.textContent).toBe('<script>alert("xss")</script>');
      expect(messageEl.innerHTML).not.toContain('<script>');
    });
  });
});
