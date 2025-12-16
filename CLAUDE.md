# CLAUDE.md - Project Guide for Claude Code

## Project Overview

NZNO Expense Claim Form is a web-based expense claim submission system for the New Zealand Nurses Organisation. Users submit expense claims with multiple expense types, attach receipts, generate PDFs, and submit to backend endpoints (Power Automate, Zapier, etc.).

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), Bootstrap 4
- **PDF Generation**: html2pdf, jsPDF, html2canvas (CDN)
- **Testing**: Bun test runner (Jest-compatible)
- **Deployment**: GitHub Pages via GitHub Actions
- **Config**: JSON-based (`config.json`, gitignored)

## Key Commands

```bash
# Testing
bun test                    # Run all tests
bun test:watch             # Watch mode
bun test:coverage          # Generate coverage report
bun test:ci                # CI mode (bail on first failure)

# Development server
python -m http.server 8000  # Or use start-server.sh / start-server.bat
```

## Project Structure

```
js/
├── app.js                  # Entry point, initialization
└── modules/
    ├── config-loader.js    # Load/validate config.json
    ├── expense-types.js    # Expense definitions & account codes
    ├── form-handler.js     # Form submission & data collection
    ├── pdf-generator.js    # PDF generation & merging
    ├── ui-handlers.js      # DOM manipulation & events
    ├── utils.js            # Utility functions (Base64, dates)
    └── __tests__/          # Unit and integration tests
```

## Architecture Patterns

- **Modular ES6**: Each module has single responsibility with clean imports/exports
- **Configuration-driven**: Behavior controlled via `config.json`
- **Dependency injection**: Modules wired together in `app.js`

## Code Conventions

- **Functions/variables**: camelCase
- **Constants**: UPPERCASE_SNAKE_CASE (e.g., `VEHICLE_RATE`, `EXPENSE_TYPES`)
- **Files**: kebab-case (e.g., `config-loader.js`)
- **Error logging**: Prefix with `[ExpenseClaim]`
- **JSDoc**: All functions require comprehensive JSDoc comments

## Testing

- Tests located in `js/modules/__tests__/`
- Global mocks in `tests/setup.js` (DOM, fetch, FileReader, etc.)
- Coverage thresholds: 80% line, function, and statement
- Run `bun test` before committing

## Configuration

- Copy `config.template.json` to `config.json`
- Required field: `apiUrl` (webhook endpoint)
- `config.json` is gitignored - use GitHub secrets for deployment

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Runs tests with coverage
2. Creates `config.json` from secrets
3. Deploys to GitHub Pages

## Key Business Logic

- **Vehicle mileage rate**: $1.04/km (defined in `expense-types.js`)
- **Line items**: Base64 encoded before submission to prevent Zapier flattening
- **Expense types**: Flights, Rental Car, Bus/Rail, Taxi/Uber, Parking, Accommodation, Meals, Private Vehicle, Other

## Important Files

- `index.html` - Main HTML structure
- `config.template.json` - Configuration template with documentation
- `docs/TESTING.md` - Comprehensive testing guide
- `docs/ZAPIER_XERO_INTEGRATION.md` - Backend integration guide
