# NZNO Expense Claim Submission Form

A web-based expense claim submission form that supports standard expenses, private vehicle mileage, and other expenses with file attachments. The form generates PDFs and submits data to a configurable backend endpoint.

## Features

-  **Standard Expense Categories**: Flights, Rental Car, Bus/Rail, Taxi/Uber, Parking, Accommodation, Meals
-  **Private Vehicle Mileage**: Automatic calculation at NZD $1.04/km
-  **Other Expenses**: Dynamic rows for additional expense types
-  **File Attachments**: Multiple file uploads per expense item
-  **PDF Export**: Download completed forms as PDF
-  **PDF Merging**: Automatically merges all attachments into a single PDF for submission
-  **Configurable Submission**: Load API endpoints and settings from `config.json`
-  **Print-Friendly**: Optimized styling for printing and PDF generation
-  **Responsive Design**: Bootstrap 4 for mobile and desktop compatibility

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/BDO-Wellington/NZNO-Expense-Claim.git
cd NZNO-Expense-Claim/NZNO-Expense-Claim
```

### 2. Configure the Application

Edit `config.json` to set your API endpoint and options:

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

You need a local web server (not just opening the HTML file):

**Quick Start (Recommended):**

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

# Using Node.js (install http-server globally)
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

## Usage

### Filling Out the Form

1. **Enter Personal Details**:
   - Full Name (required)
   - Employee ID (required)
   - Expense Claim Date (required, defaults to today)

2. **Standard Expenses**:
   - Enter amounts for applicable expense types
   - Attach receipts/documents for each expense

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

## Project Structure

```
NZNO-Expense-Claim/
 index.html          # Main application file (single-page app)
 config.json         # Configuration (API endpoint, flags)
 404.html            # GitHub Pages 404 handler
 .nojekyll           # Prevents Jekyll processing on GitHub Pages
 LICENSE             # License file
 README.md           # This file
```

## Modularization Recommendations

### Current State
The application is currently a **single-file HTML application** with embedded JavaScript and CSS. This works well for:
-  Simple deployment (just one file to manage)
-  No build process required
-  Easy to understand the entire flow

### Recommended Modular Structure (Future Enhancement)

For better maintainability and scalability, consider refactoring to:

```
NZNO-Expense-Claim/
 index.html (minimal structure)
 config.json
 css/
    styles.css (all CSS extracted)
 js/
    app.js (main initialization)
    config-loader.js (CONFIG loading)
    expense-types.js (expense definitions)
    ui-handlers.js (DOM manipulation, event listeners)
    form-handler.js (form submission logic)
    pdf-generator.js (PDF generation functions)
    utils.js (fileToBase64, logging, etc.)
 README.md
```

**Benefits of Modularization:**
- Easier testing of individual modules
- Better code organization and maintainability
- Ability to use ES6 modules
- Clearer separation of concerns
- Easier to onboard new developers

**To implement this:**
1. Extract CSS to `css/styles.css`
2. Split JavaScript into separate modules
3. Use ES6 module imports (`<script type="module">`)
4. Remove inline event handlers (`onclick`)
5. Use a bundler like Vite or Webpack (optional)

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

## Browser Compatibility

-  Chrome 90+
-  Firefox 88+
-  Safari 14+
-  Edge 90+

## License

See [LICENSE](LICENSE) file for details.

---

**Author**: James McNeil  
**Last Updated**: October 28, 2025  
**Repository**: [BDO-Wellington/NZNO-Expense-Claim](https://github.com/BDO-Wellington/NZNO-Expense-Claim)
