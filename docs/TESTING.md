# Testing Guide

This project uses [Bun](https://bun.sh/) as the test runner. Bun provides a fast, Jest-compatible testing experience with built-in coverage reporting.

## Quick Start

```bash
# Run all tests
bun test

# Run tests in watch mode (re-runs on file changes)
bun test:watch

# Run tests with coverage report
bun test:coverage

# Run tests for CI (stops on first failure)
bun test:ci

# Filter tests by name
bun test:filter "email"

# Detect flaky tests (runs each test 3 times)
bun test:flaky
```

## Project Structure

```
NZNO-Expense-Claim/
├── tests/
│   └── setup.js              # Global test setup (preloaded)
├── js/modules/__tests__/
│   ├── utils.test.js         # Unit tests for utils
│   ├── expense-types.test.js # Unit tests for expense types
│   ├── config-loader.test.js # Unit tests for config
│   ├── form-handler.test.js  # Unit tests for form handler
│   └── form-handler.integration.test.js  # Integration tests
├── bunfig.toml               # Bun test configuration
└── package.json              # npm scripts
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, expect, test } from 'bun:test';

describe('MyModule', () => {
  test('does something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Async Tests

```javascript
test('async operation', async () => {
  expect.assertions(1);  // Verify assertion runs

  const result = await fetchData();
  expect(result).toBe('expected');
});
```

### Parametrized Tests

Use `test.each()` to reduce duplication:

```javascript
test.each([
  { input: 'test@example.com', expected: true },
  { input: 'invalid', expected: false },
  { input: '', expected: false },
])('isValidEmail($input) returns $expected', ({ input, expected }) => {
  expect(isValidEmail(input)).toBe(expected);
});
```

### Lifecycle Hooks

```javascript
import { describe, test, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';

describe('MyModule', () => {
  beforeAll(() => {
    // Runs once before all tests in this describe block
  });

  afterAll(() => {
    // Runs once after all tests complete
  });

  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });
});
```

## Test Utilities

The `tests/setup.js` file provides utilities for testing browser-based code.

### Importing Utilities

```javascript
import {
  mockFetch,
  resetAllMocks,
  createMockForm,
  createMockEvent,
  MockResponses,
  setFetchResponse,
  getFetchBody,
  getFetchUrl,
  flushPromises,
  spyOn,
} from '../../../tests/setup.js';
```

### Mock Fetch Responses

```javascript
import { setFetchResponse, MockResponses } from '../../../tests/setup.js';

// Success response
setFetchResponse(MockResponses.success);

// Success with JSON data
setFetchResponse(() => MockResponses.successWithData({ id: 1, name: 'Test' }));

// HTTP error (400, 500, etc.)
setFetchResponse(() => MockResponses.failure(400));

// Network error
setFetchResponse(() => MockResponses.networkError('Connection refused'));

// Sequential responses (different response each call)
setFetchResponse(MockResponses.sequential([
  MockResponses.success,
  MockResponses.failure,
  MockResponses.success,
]));
```

### Creating Mock Forms

```javascript
import { createMockForm, createMockEvent } from '../../../tests/setup.js';

const mockForm = createMockForm({
  fullName: 'John Doe',
  email: 'john@example.com',
  amount: '100.50',
});

const mockEvent = createMockEvent(mockForm);

// Use in tests
await handleSubmit(mockEvent);
```

### Verifying Fetch Calls

```javascript
import { mockFetch, getFetchUrl, getFetchBody } from '../../../tests/setup.js';

test('sends correct data', async () => {
  await submitForm(data);

  // Check URL
  expect(getFetchUrl()).toBe('https://api.example.com/submit');

  // Check request body
  const body = getFetchBody();
  expect(body.name).toBe('John');
  expect(body.amount).toBe(100);

  // Check call count
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
```

### Resetting Mocks

Always reset mocks in `beforeEach()`:

```javascript
import { resetAllMocks } from '../../../tests/setup.js';

describe('MyTests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // tests...
});
```

### Async Utilities

```javascript
import { flushPromises } from '../../../tests/setup.js';

test('handles async updates', async () => {
  triggerAsyncOperation();

  await flushPromises();  // Wait for pending promises

  expect(result).toBe('updated');
});
```

## Global Mocks

The setup file automatically provides these browser globals:

| Global | Description |
|--------|-------------|
| `fetch` | Mocked fetch API |
| `document` | DOM document mock |
| `window` | Window object mock |
| `btoa`/`atob` | Base64 encoding |
| `html2canvas` | Canvas screenshot mock |
| `html2pdf` | PDF generation mock |
| `jspdf` | jsPDF library mock |

## Console Output

By default, `console.log`, `console.warn`, and `console.info` are suppressed during tests to reduce noise.

To enable console output for debugging:

```bash
VERBOSE_TESTS=1 bun test
```

## Coverage

Coverage is configured in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = { line = 0.8, function = 0.8, statement = 0.8 }
```

Current thresholds:
- **80% line coverage**
- **80% function coverage**
- **80% statement coverage**

View coverage report:

```bash
bun test:coverage
```

## CI/CD Integration

The GitHub Actions workflow runs tests before deployment:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun test --bail --coverage

  deploy:
    needs: test  # Only deploys if tests pass
    # ...
```

## Best Practices

### 1. Use Descriptive Test Names

```javascript
// Good
test('returns false when email is missing @ symbol', () => { ... });

// Bad
test('test1', () => { ... });
```

### 2. One Assertion Per Concept

```javascript
// Good - clear what failed
test('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

test('rejects email without @', () => {
  expect(isValidEmail('invalid')).toBe(false);
});

// Or use test.each for multiple cases
```

### 3. Use `expect.assertions()` for Async Tests

```javascript
test('handles async error', async () => {
  expect.assertions(1);  // Ensures the assertion runs

  try {
    await failingOperation();
  } catch (error) {
    expect(error.message).toBe('Expected error');
  }
});
```

### 4. Reset State Between Tests

```javascript
beforeEach(() => {
  resetAllMocks();
  // Reset any other state
});
```

### 5. Use Parametrized Tests for Similar Cases

```javascript
// Instead of multiple similar tests
test.each([
  { input: 0, expected: 0 },
  { input: 100, expected: 104 },
  { input: 50.5, expected: 52.52 },
])('calculates vehicle amount for $input km', ({ input, expected }) => {
  expect(calculateAmount(input)).toBe(expected);
});
```

### 6. Keep Tests Fast

- Mock external dependencies
- Avoid real network calls
- Use the preload setup for browser mocks

## Troubleshooting

### Tests Not Running

Check that test files match the pattern:
- `*.test.js`
- `*.test.ts`
- `*_test.js`
- `*.spec.js`

### Mock Not Working

Ensure you're importing from the setup file and calling `resetAllMocks()`:

```javascript
import { mockFetch, resetAllMocks } from '../../../tests/setup.js';

beforeEach(() => {
  resetAllMocks();
});
```

### Console Output Missing

Enable verbose mode:

```bash
VERBOSE_TESTS=1 bun test
```

### Coverage Too Low

Run coverage to see uncovered lines:

```bash
bun test:coverage
```

The report shows which lines need tests.

## Resources

- [Bun Test Runner Documentation](https://bun.sh/docs/test)
- [Writing Tests Guide](https://bun.sh/docs/test/writing)
- [Jest Matchers Reference](https://jestjs.io/docs/expect) (Bun is Jest-compatible)
