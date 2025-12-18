# NZNO Expense Claim Submission Form

A modern, modular web-based expense claim submission form that supports standard expenses, private vehicle mileage, and other expenses with file attachments. The form generates PDFs and submits data to a configurable backend endpoint.

## Features

-  **Standard Expense Categories**: Flights, Rental Car, Bus/Rail, Taxi/Uber, Parking, Accommodation, Meals
-  **Private Vehicle Mileage**: Automatic calculation at NZD $1.04/km
-  **Other Expenses**: Dynamic rows for additional expense types
-  **File Attachments**: Multiple file uploads per expense item
-  **PDF Export**: Download completed forms as PDF with optimized page breaks
-  **PDF Merging**: Automatically merges all attachments into a single PDF for submission
-  **Configurable Submission**: Load API endpoints and settings from `config.json`
-  **Print-Friendly**: Optimized styling for printing and PDF generation
-  **Responsive Design**: Bootstrap 4 for mobile and desktop compatibility
-  **Modular Architecture**: Clean separation of concerns with ES6 modules

## Project Structure

```
expense-claim-app/
├── index.html                  # Main HTML structure
├── config.json                 # Application configuration (gitignored)
├── config.template.json        # Configuration template
├── package.json                # Project scripts and dependencies
├── bunfig.toml                 # Bun configuration
├── playwright.config.js        # Playwright E2E test config
├── mock-server.js              # Mock API server for development
├── 404.html                    # GitHub Pages 404 handler
├── .nojekyll                   # Prevents Jekyll processing
├── LICENSE                     # License file
├── README.md                   # This file
├── CLAUDE.md                   # AI assistant project guide
├── css/
│   └── styles.css              # All application styles
├── docs/
│   ├── FRONTEND-REDESIGN.md    # Frontend redesign documentation
│   ├── NZNO-BRANDING.md        # Branding guidelines
│   ├── TESTING.md              # Comprehensive testing guide
│   └── ZAPIER_XERO_INTEGRATION.md  # Zapier + Xero integration guide
├── js/
│   ├── app.js                  # Main entry point & initialization
│   └── modules/
│       ├── config-loader.js    # Configuration loading & validation
│       ├── expense-types.js    # Expense type definitions & constants
│       ├── form-handler.js     # Form submission & data collection
│       ├── icons.js            # SVG icon components
│       ├── modal.js            # Modal dialog component
│       ├── pdf-generator.js    # PDF generation & merging
│       ├── toast.js            # Toast notification system
│       ├── ui-handlers.js      # DOM manipulation & event handling
│       ├── utils.js            # Utility functions
│       ├── validation.js       # Form validation logic
│       └── __tests__/          # Unit and integration tests
├── tests/
│   └── setup.js                # Global test mocks and helpers
└── e2e/
    ├── expense-form.spec.js    # E2E functional tests
    └── visual-regression.spec.js  # Visual regression tests
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/BDO-Wellington/NZNO-Expense-Claim.git
cd NZNO-Expense-Claim/NZNO-Expense-Claim
```

### 2. Configure the Application

Copy the template and edit `config.json` to set your API endpoint and options:

```bash
cp config.template.json config.json
```

Edit `config.json`:

```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": false,
  "STRINGIFY_LINE_ITEMS_FOR_ZAPIER": true,
  "API_URL": "https://your-api-endpoint.com/submit",
  "DEBUG_MODE": "PRODUCTION"
}
```

**Configuration Options:**
- `SUBMIT_INDIVIDUAL_LINE_ITEMS`: `true` to submit each expense item separately, `false` to submit all as one payload
- `STRINGIFY_LINE_ITEMS_FOR_ZAPIER`: `true` to JSON-stringify line items (prevents Zapier from flattening arrays), `false` for raw arrays
- `API_URL`: Your backend API endpoint (Power Automate, Zapier, custom server, etc.)
- `DEBUG_MODE`: `"DEBUG"` to hide PDF download button, `"PRODUCTION"` for normal operation

### 3. Deploy

#### Option A: GitHub Pages (Recommended)

1. Push your code to a GitHub repository
2. Go to **Settings** > **Pages**
3. Select **Deploy from a branch** > **main** > **/ (root)**
4. Your site will be available at `https://[username].github.io/[repo-name]/`

#### Option B: Local Development

You need a local web server (not just opening the HTML file due to ES6 modules).

**Prerequisites:**
- [Bun](https://bun.sh/) runtime (recommended)
- Or Node.js 18+

**Quick Start with Bun (Recommended):**

```bash
# Install dependencies
bun install

# Start development server with mock API
bun run dev
```

This starts:
- Static file server at `http://localhost:5173`
- Mock API server for testing form submissions

**Alternative Servers:**

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve -p 5173
```

Then open `http://localhost:5173` in your browser.

#### Option C: Other Hosting

Upload all files to any static hosting service:
- Netlify
- Vercel
- Azure Static Web Apps
- AWS S3 + CloudFront
- Cloudflare Pages

**Note**: ES6 modules require proper MIME types, so ensure your hosting serves `.js` files as `application/javascript`.

## Usage

### Filling Out the Form

1. **Enter Personal Details**:
   - Full Name (required)
   - Employee ID (required)
   - Expense Claim Date (required, defaults to today)

2. **Standard Expenses**:
   - Enter amounts for applicable expense types
   - Attach receipts/documents for each expense
   - Use arrow keys or click to change values (scroll wheel is disabled)

3. **Private Vehicle**:
   - Enter kilometres driven
   - Amount is automatically calculated at $1.04/km
   - Add optional comment/description

4. **Other Expenses**:
   - Click "Add Other Expense" to add custom expense items
   - Enter description, amount, and attach files
   - Click "Remove" to delete unwanted rows

5. **Submit**:
   - Click "Submit Claim" to send to the configured API
   - Or click "Download as PDF" to save locally

## Module Overview

### Core Modules

#### `app.js` - Main Entry Point
Initializes the application and wires up all modules. Handles:
- Configuration loading
- PDF library validation
- UI initialization
- Event listener setup

#### `config-loader.js` - Configuration Management
Loads and validates application configuration from `config.json`. Provides error handling and user feedback for configuration issues.

#### `expense-types.js` - Expense Definitions
Defines expense categories, account codes, and calculation constants:
- Standard expense types (Flights, Rental Car, etc.)
- Vehicle mileage rate ($1.04/km)
- Helper functions for expense lookups

#### `ui-handlers.js` - User Interface
Handles all DOM manipulation and UI updates:
- Dynamic expense table generation
- Add/remove expense rows
- Vehicle amount calculation
- Alert messages
- Form state management
- Print-friendly mode
- Scroll wheel disabling on number inputs

#### `form-handler.js` - Form Processing
Manages form submission and data collection:
- Form data extraction
- File attachment handling
- Individual vs bulk submission modes
- API payload construction
- Error handling and validation

#### `pdf-generator.js` - PDF Generation
Handles PDF creation and manipulation:
- Form-to-PDF conversion
- PDF download functionality
- Attachment merging
- Page break optimization
- Print mode styling

#### `utils.js` - Utility Functions
Provides reusable helper functions:
- File-to-Base64 conversion
- Date formatting
- Filename sanitization
- Error logging
- Attachment collection

#### `validation.js` - Form Validation
Handles comprehensive form validation:
- Required field validation
- Input format validation (dates, numbers)
- Real-time validation feedback
- Error message display

#### `toast.js` - Toast Notifications
Manages user feedback notifications:
- Success, error, warning, and info toasts
- Auto-dismiss with configurable duration
- Stacking multiple notifications
- Accessible announcements

#### `modal.js` - Modal Dialogs
Reusable modal dialog component:
- Confirmation dialogs
- Custom content modals
- Keyboard navigation (Escape to close)
- Focus management

#### `icons.js` - SVG Icons
Centralized SVG icon management:
- Inline SVG components
- Consistent styling
- Easy icon reuse across modules

## Features

### Architecture
- ES6 modular architecture with clean separation of concerns
- Configuration-driven behavior via `config.json`

### UI
- Disabled scroll wheel on number inputs to prevent accidental changes
- Print-friendly styling with optimized PDF generation
- Enhanced form validation and error messaging

### Integrations
- Zapier webhook support with Xero bill creation
- See [docs/ZAPIER_XERO_INTEGRATION.md](docs/ZAPIER_XERO_INTEGRATION.md) for setup

## Development

### Prerequisites
- [Bun](https://bun.sh/) runtime (for testing and dev server)
- Modern web browser with ES6 module support
- Text editor or IDE

### Testing

The project uses Bun's built-in test runner (Jest-compatible) for unit and integration tests, and Playwright for E2E tests.

**Unit & Integration Tests:**

```bash
# Run all tests
bun test

# Watch mode for development
bun test:watch

# Run with coverage report
bun test:coverage

# CI mode (bail on first failure)
bun test:ci

# Run specific test file
bun test form-handler.test.js

# Filter tests by name
bun test:filter "validates required fields"
```

**E2E Tests (Playwright):**

```bash
# Run E2E tests
bun run e2e

# Run with browser visible
bun run e2e:headed

# Interactive UI mode
bun run e2e:ui

# Debug mode
bun run e2e:debug

# View test report
bun run e2e:report
```

**Test Structure:**
- `js/modules/__tests__/` - Unit and integration tests
- `tests/setup.js` - Global mocks (DOM, fetch, FileReader, etc.)
- `e2e/` - Playwright E2E and visual regression tests

See [docs/TESTING.md](docs/TESTING.md) for comprehensive testing documentation.

### Browser Console
Open developer tools (F12) to view:
- Configuration loading messages
- PDF library validation
- Module initialization logs
- Error messages and debugging info

## Security Considerations

###  Important Security Notes

1. **Do NOT put sensitive secrets in `config.json`**:
   - API keys, passwords, or tokens should never be in frontend code
   - Use a backend proxy to handle authentication
   - Or use secured API endpoints (e.g., Power Automate with authentication)

2. **API_URL is visible to users**:
   - Anyone can see your API endpoint in the browser
   - Ensure your backend validates and authenticates requests
   - Rate-limit your API to prevent abuse

3. **GitHub Pages is public**:
   - All code and config is publicly visible
   - Don't include any sensitive information
   - Use environment-specific configs for different deployments

4. **File Upload Security**:
   - Backend should validate file types and sizes
   - Scan uploads for malware
   - Store files securely with appropriate access controls

## Browser Compatibility

-  Chrome 90+ (Recommended)
-  Firefox 88+
-  Safari 14+
-  Edge 90+

**Note**: ES6 modules require modern browser support. For older browsers, consider using a bundler like Webpack or Vite.

## Troubleshooting

### Configuration Not Loading
- Ensure `config.json` exists and is valid JSON
- Check browser console for errors
- Verify web server is serving JSON with correct MIME type

### PDF Not Generating
- Check browser console for library loading errors
- Ensure html2pdf and jsPDF libraries are loading from CDN
- Try clearing browser cache and reloading

### Form Not Submitting
- Verify API_URL in `config.json` is correct
- Check browser console for network errors
- Ensure backend endpoint is accessible and accepting requests
- Check CORS settings on backend

### ES6 Module Errors
- Ensure you're accessing via HTTP (not file://)
- Verify web server is serving .js files with correct MIME type
- Check for typos in import paths

## Future Enhancements

### Planned Features
- [ ] TypeScript conversion
- [ ] Frontend UI redesign with improved UX

### Completed
- [x] Unit tests with Bun test runner
- [x] Integration tests
- [x] E2E tests with Playwright
- [x] Visual regression testing
- [x] Form validation module
- [x] Toast notification system
- [x] Modal dialog component

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m ''Add some AmazingFeature''`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact the development team
- See [docs/ZAPIER_XERO_INTEGRATION.md](docs/ZAPIER_XERO_INTEGRATION.md) for integration setup

---

**Author**: James McNeil
**Last Updated**: December 2025
**Version**: 2.1 (Testing & Validation)
**Repository**: [BDO-Wellington/NZNO-Expense-Claim](https://github.com/BDO-Wellington/NZNO-Expense-Claim)
