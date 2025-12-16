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
NZNO-Expense-Claim/
 index.html                  # Main HTML structure
 config.json                 # Application configuration
 config.template.json        # Configuration template
 404.html                    # GitHub Pages 404 handler
 .nojekyll                   # Prevents Jekyll processing
 LICENSE                     # License file
 README.md                   # This file
 start-server.bat            # Windows server startup script
 start-server.sh             # Mac/Linux server startup script
 css/
    styles.css             # All application styles
 docs/
    ZAPIER_XERO_INTEGRATION.md  # Zapier + Xero integration guide
 js/
     app.js                 # Main entry point & initialization
     modules/
         config-loader.js   # Configuration loading & validation
         expense-types.js   # Expense type definitions & constants
         form-handler.js    # Form submission & data collection
         pdf-generator.js   # PDF generation & merging
         ui-handlers.js     # DOM manipulation & event handling
         utils.js           # Utility functions
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
  "API_URL": "https://your-api-endpoint.com/submit",
  "DEBUG_MODE": "PRODUCTION"
}
```

**Configuration Options:**
- `SUBMIT_INDIVIDUAL_LINE_ITEMS`: `true` to submit each expense item separately, `false` to submit all as one payload
- `API_URL`: Your backend API endpoint (Power Automate, Zapier, custom server, etc.)
- `DEBUG_MODE`: `"DEBUG"` to hide PDF download button, `"PRODUCTION"` for normal operation

### 3. Deploy

#### Option A: GitHub Pages (Recommended)

1. Push your code to a GitHub repository
2. Go to **Settings** > **Pages**
3. Select **Deploy from a branch** > **main** > **/ (root)**
4. Your site will be available at `https://[username].github.io/[repo-name]/`

#### Option B: Local Development

You need a local web server (not just opening the HTML file due to ES6 modules):

**Quick Start Scripts (Recommended):**

Windows:
```cmd
start-server.bat
```

Mac/Linux:
```bash
chmod +x start-server.sh
./start-server.sh
```

**Manual Start:**

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000/index.html` in your browser.

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
- Modern web browser with ES6 module support
- Local web server (Python, Node.js, or PHP)
- Text editor or IDE

### Testing
To test the application locally:

1. Start the local server:
   ```bash
   python -m http.server 8000
   ```

2. Open `http://localhost:8000/index.html` in your browser

3. Test all features:
   - Form filling and validation
   - Dynamic row addition/removal
   - File attachments
   - PDF generation
   - Form submission

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
- [ ] Unit tests with Vitest/Jest
- [ ] TypeScript conversion

### Might Do
- [ ] Mobile app wrapper

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
**Last Updated**: October 28, 2025  
**Version**: 2.0 (Modular)  
**Repository**: [BDO-Wellington/NZNO-Expense-Claim](https://github.com/BDO-Wellington/NZNO-Expense-Claim)
