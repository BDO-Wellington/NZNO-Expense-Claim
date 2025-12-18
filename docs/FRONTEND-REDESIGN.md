# Frontend Redesign: UI/UX Implementation Plan

This document outlines the comprehensive frontend redesign plan for the NZNO Expense Claim Form, focusing on user feedback and visual polish improvements.

## Overview

| Aspect | Current | Target |
|--------|---------|--------|
| **Framework** | Bootstrap 4 (~150KB) | Modern CSS (~10KB) |
| **User Feedback** | Basic alert system | Toast notifications, loading states |
| **Validation** | HTML5 only | Real-time inline validation |
| **Animations** | Button hovers only | Full micro-animation system |
| **Confirmations** | None | Modal dialogs for destructive actions |

## Priorities

1. **User Feedback** - Loading states, toasts, progress indicators
2. **Visual Polish** - Animations, icons, improved visual hierarchy

## Architecture

### New JavaScript Modules

```
js/modules/
├── toast.js         # Toast notification system
├── modal.js         # Confirmation dialog system
├── validation.js    # Field validation logic
└── icons.js         # Inline SVG icons
```

### New CSS Structure

```
css/
├── base/
│   ├── variables.css    # Extended CSS custom properties
│   └── animations.css   # Keyframe definitions
└── components/
    ├── spinner.css      # Loading spinner
    ├── modal.css        # Confirmation dialogs
    ├── toast.css        # Toast notifications
    ├── validation.css   # Form validation states
    └── success.css      # Success animation
```

---

## Phase 1: User Feedback Foundation

### 1.1 Toast Notification System

Create a toast notification system to replace the current alert-based feedback.

**Features:**
- Slide-in animation from right
- Auto-dismiss with progress bar (5s for success)
- Manual dismiss button
- Types: success (green), error (red), warning (amber), info (blue)
- NZNO brand colors

**API:**
```javascript
import { toast } from './toast.js';

toast.success('Expense claim submitted successfully!');
toast.error('Failed to submit form. Please try again.');
toast.warning('Some attachments could not be processed.');
toast.info('Your form will be saved automatically.');
```

### 1.2 Loading Spinner Component

**CSS Implementation:**
```css
.spinner {
  --spinner-size: 24px;
  --spinner-color: var(--nzno-purple);

  width: var(--spinner-size);
  height: var(--spinner-size);
  border: 3px solid var(--nzno-light);
  border-top-color: var(--spinner-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Variants:**
- `.spinner--small` (16px) - For buttons
- `.spinner--large` (40px) - For overlays
- `.spinner--white` - For dark backgrounds

### 1.3 Button Loading States

**Implementation:**
```javascript
export function setButtonLoading(button, loading) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.classList.add('btn--loading');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    button.classList.remove('btn--loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = button.dataset.originalText;
  }
}
```

### 1.4 Progress Overlay

For PDF generation (can take several seconds), show a modal progress indicator:

```html
<div class="progress-overlay">
  <div class="progress-container">
    <div class="spinner spinner--large"></div>
    <p class="progress-message">Generating PDF...</p>
    <div class="progress-bar">
      <div class="progress-bar__fill progress-bar__fill--indeterminate"></div>
    </div>
  </div>
</div>
```

---

## Phase 2: Confirmation & Validation

### 2.1 Modal Dialog System

Create an accessible modal system for confirmation dialogs.

**Features:**
- Focus trap (Tab cycles within modal)
- ESC key to close
- Click outside to close
- Returns Promise for async/await usage
- Accessible ARIA attributes

**API:**
```javascript
import { createModal } from './modal.js';

const confirmed = await createModal({
  title: 'Remove Expense',
  message: 'Are you sure you want to remove this expense row?',
  confirmText: 'Remove',
  cancelText: 'Keep',
  type: 'warning'
});

if (confirmed) {
  // User confirmed, proceed with removal
}
```

### 2.2 Updated Row Removal

Change `removeExpenseRow()` to be async and show confirmation:

```javascript
export async function removeExpenseRow(button) {
  const confirmed = await createModal({
    title: 'Remove Expense',
    message: 'Are you sure you want to remove this expense row? This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Keep',
    type: 'warning'
  });

  if (confirmed) {
    const row = button.closest('tr');
    if (row) {
      row.classList.add('removing'); // Animate out
      setTimeout(() => row.remove(), 200);
    }
  }
}
```

### 2.3 Validation Module

Real-time field validation with configurable rules.

**Validation Rules:**
```javascript
export const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z\s'-]+$/,
    messages: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  employeeId: {
    required: true,
    pattern: /^[A-Z0-9-]+$/i,
    messages: {
      required: 'Employee ID is required',
      pattern: 'Invalid employee ID format'
    }
  },
  expenseDate: {
    required: true,
    maxDate: () => new Date(), // Cannot be in future
    messages: {
      required: 'Expense date is required',
      maxDate: 'Date cannot be in the future'
    }
  }
};
```

### 2.4 Validation Styles

```css
.form-control.is-valid {
  border-color: var(--nzno-green);
  background-image: url("data:..."); /* checkmark SVG */
}

.form-control.is-invalid {
  border-color: var(--nzno-red);
  background-image: url("data:..."); /* X SVG */
}

.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--nzno-red);
  font-size: 13px;
  margin-top: 6px;
  animation: slideDown 0.2s ease-out;
}
```

---

## Phase 3: Visual Polish

### 3.1 Animation System

Define consistent animation timing and easing:

```css
:root {
  /* Timing */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  /* Easing */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 3.2 Animation Matrix

| Component | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Button hover | 200ms | ease-in-out | transform, box-shadow |
| Toast enter | 300ms | ease-bounce | transform (slideX) |
| Toast exit | 200ms | ease-in | transform, opacity |
| Modal overlay | 200ms | ease-out | opacity |
| Modal content | 200ms | ease-bounce | transform (scale) |
| Validation error | 200ms | ease-out | opacity, transform (slideY) |
| Spinner | 800ms | linear | transform (rotate) |
| Success check | 600ms | ease-in-out | stroke-dashoffset |

### 3.3 Enhanced Button States

```css
.btn {
  transition: all var(--duration-normal) var(--ease-in-out);
}

.btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(80, 31, 116, 0.3);
}

.btn:active {
  transform: scale(0.98);
}
```

### 3.4 Success Animation

Animated SVG checkmark on form submission:

```html
<svg class="success-checkmark" viewBox="0 0 52 52">
  <circle class="success-checkmark__circle" cx="26" cy="26" r="25"/>
  <path class="success-checkmark__check" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
</svg>
```

```css
.success-checkmark__circle {
  stroke: var(--nzno-green);
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s ease-in-out forwards;
}

.success-checkmark__check {
  stroke: var(--nzno-green);
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s ease-in-out 0.4s forwards;
}

@keyframes stroke {
  100% { stroke-dashoffset: 0; }
}
```

### 3.5 Icon System

Inline SVG icons for consistency and theming:

```javascript
// js/modules/icons.js
export const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  // ... more icons
};

export function icon(name, className = '') {
  return ICONS[name]?.replace('<svg', `<svg class="icon ${className}"`) || '';
}
```

---

## Phase 4: Bootstrap Removal

### 4.1 Grid Replacement

Replace Bootstrap grid with CSS Grid:

```css
/* Before: Bootstrap */
<div class="row">
  <div class="col-md-6">...</div>
  <div class="col-md-6">...</div>
</div>

/* After: CSS Grid */
.details-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
```

### 4.2 Utility Classes

Create minimal utility classes:

```css
/* Spacing */
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mb-3 { margin-bottom: 1rem; }

/* Display */
.d-none { display: none; }
.d-flex { display: flex; }

/* Visibility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

### 4.3 Responsive Breakpoints

```css
/* Mobile first */
.details-col { width: 100%; }

/* Tablet */
@media (min-width: 768px) {
  .details-row { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 992px) {
  .container { max-width: 960px; }
}

/* Large */
@media (min-width: 1200px) {
  .container { max-width: 1140px; }
}
```

---

## Accessibility Requirements

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| Toast container | `aria-live` | `polite` |
| Loading button | `aria-busy` | `true` |
| Modal | `role` | `dialog` |
| Modal | `aria-modal` | `true` |
| Invalid input | `aria-invalid` | `true` |
| Error message | `aria-describedby` | Links to input |

---

## Testing Requirements

### New Test Files

- `js/modules/__tests__/toast.test.js`
- `js/modules/__tests__/modal.test.js`
- `js/modules/__tests__/validation.test.js`

### Test Coverage

| Module | Tests Required |
|--------|----------------|
| `toast.js` | Creation, auto-dismiss, manual dismiss, accessibility |
| `modal.js` | Open/close, keyboard navigation, focus trap, Promise resolution |
| `validation.js` | Each validation rule, error display, clearing errors |
| `ui-handlers.js` | Async row removal, loading states |

---

## Migration Strategy

1. **Phase 1-3**: Add new components alongside Bootstrap
2. **Phase 4**: Gradually replace Bootstrap classes with custom CSS
3. **Final step**: Remove Bootstrap CDN from `index.html`

This allows incremental testing and rollback if needed.

---

## Related Issues

See GitHub issues with label `frontend-redesign` for tracking:
- Phase 1: User Feedback Foundation
- Phase 2: Confirmation & Validation
- Phase 3: Visual Polish
- Phase 4: Bootstrap Removal
