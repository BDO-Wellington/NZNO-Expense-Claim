# Code Modularization Recommendations for NZNO Expense Claim Form

## Executive Summary

The current application is a **single-file HTML application** (~700 lines) with all CSS and JavaScript embedded. While this approach works well for simple deployment, modularizing the code will improve:

- **Maintainability**: Easier to find and fix bugs
- **Testability**: Individual modules can be unit tested
- **Scalability**: New features can be added without bloating one file
- **Collaboration**: Multiple developers can work on different modules
- **Reusability**: Utility functions can be shared across projects

---

## Current Architecture Issues

### 1. **Single Responsibility Principle Violations**
- One file handles UI, business logic, PDF generation, and API calls
- Functions mix concerns (e.g., form submission also handles PDF generation)

### 2. **Global Scope Pollution**
- All functions are in global scope
- No namespacing or module pattern
- Risk of naming conflicts

### 3. **Tight Coupling**
- UI code directly calls API functions
- Hard to swap out PDF library or API client
- Difficult to test in isolation

### 4. **Inline Event Handlers**
- `onclick="addRow()"` and `onclick="removeRow(this)"` in HTML
- Makes it harder to track event listeners
- Prevents Content Security Policy (CSP) compliance

### 5. **Duplicate Event Listeners**
- Multiple `DOMContentLoaded` listeners
- Some code commented out (`//initExpenseClaimApp()`)

### 6. **CSS in HTML**
- Styles embedded in `<style>` tag
- Can't be cached separately
- Harder to maintain and override

---

## Recommended Modular Structure

### Directory Structure

```
NZNO-Expense-Claim/
 index.html                  # Minimal HTML structure
 config.json                 # Configuration file
 css/
    styles.css             # All application styles
 js/
    app.js                 # Main entry point & initialization
    modules/
       config-loader.js   # Configuration loading
       expense-types.js   # Expense type definitions
       ui-handlers.js     # DOM manipulation & events
       form-handler.js    # Form submission logic
       pdf-generator.js   # PDF generation
       utils.js           # Utility functions
    vendor/
        html2pdf.bundle.js # Local copy (optional)
        jspdf.umd.js       # Local copy (optional)
 README.md
 MODULARIZATION.md
 LICENSE
```

---

## Module Breakdown

### **1. config-loader.js**
**Purpose**: Load and validate configuration

```javascript
// js/modules/config-loader.js
export async function loadConfig() {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load config.json');
    const config = await response.json();
    if (!config) throw new Error('Config is empty');
    return config;
  } catch (err) {
    throw new Error(`Failed to load configuration: ${err.message}`);
  }
}

export function validateConfig(config) {
  const required = ['API_URL', 'DEBUG_MODE', 'SUBMIT_INDIVIDUAL_LINE_ITEMS'];
  for (const key of required) {
    if (config[key] === undefined) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
  return true;
}
```

---

### **2. expense-types.js**
**Purpose**: Define expense categories and their properties

```javascript
// js/modules/expense-types.js
export const EXPENSE_TYPES = [
  { name: "Flights", accountCode: "480" },
  { name: "Rental Car", accountCode: "486" },
  { name: "Fares - Bus/Rail", accountCode: "476" },
  { name: "Taxi/Uber", accountCode: "482" },
  { name: "Parking", accountCode: "482" },
  { name: "Accommodation", accountCode: "484" },
  { name: "Meals", accountCode: "484" }
];

export const VEHICLE_RATE = 1.04;

export function getExpenseByName(name) {
  return EXPENSE_TYPES.find(t => t.name === name);
}
```

---

### **3. utils.js**
**Purpose**: Reusable utility functions

```javascript
// js/modules/utils.js
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

export async function collectAttachments(fileInput) {
  const attachments = [];
  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      try {
        const base64 = await fileToBase64(file);
        attachments.push({ filename: file.name, content: base64 });
      } catch (error) {
        throw new Error(`Failed to process attachment: ${file.name}`);
      }
    }
  }
  return attachments;
}

export function logError(message, error) {
  if (window.console && window.console.error) {
    console.error(`[ExpenseClaim] ${message}:`, error);
  }
  // Optional: Send to error tracking service
}

export function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `--`;
}

export function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}
```

---

### **4. ui-handlers.js**
**Purpose**: DOM manipulation and UI interactions

```javascript
// js/modules/ui-handlers.js
import { EXPENSE_TYPES, VEHICLE_RATE } from './expense-types.js';

export function generateExpenseTable() {
  const tableBody = document.querySelector("#StandardExpensesTable tbody");
  if (!tableBody) return;
  
  tableBody.innerHTML = EXPENSE_TYPES.map(type => `
    <tr>
      <td>${type.name}</td>
      <td><input type="number" class="form-control" name="${type.name.toLowerCase().replace(/\s+/g, '')}Amount" step="0.01"></td>
      <td><input type="file" class="form-control-file" name="${type.name.toLowerCase().replace(/\s+/g, '')}Attachments" multiple></td>
    </tr>
  `).join("");
}

export function addOtherExpenseRow() {
  const tableBody = document.getElementById("otherExpensesBody");
  if (!tableBody) return;
  
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><input type="text" class="form-control" name="other_description[]"></td>
    <td><input type="number" class="form-control" name="other_amount[]" step="0.01"></td>
    <td><input type="file" class="form-control-file" name="other_attachment[]" multiple></td>
    <td><button type="button" class="btn btn-danger btn-sm remove-row">Remove</button></td>
  `;
  tableBody.appendChild(newRow);
}

export function removeExpenseRow(button) {
  const row = button.closest("tr");
  if (row) row.remove();
}

export function calculateVehicleAmount() {
  const kmsInput = document.getElementById("kms");
  const amountInput = document.getElementById("vehicleAmount");
  if (!kmsInput || !amountInput) return;
  
  const kms = parseFloat(kmsInput.value) || 0;
  amountInput.value = (kms * VEHICLE_RATE).toFixed(2);
}

export function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById("alert-container");
  if (alertContainer) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type}" role="alert">
        ${message}
      </div>
    `;
  }
}

export function setFormToViewMode(form) {
  try {
    Array.from(form.elements).forEach((element) => {
      if (element.tagName.toLowerCase() !== "button") {
        element.disabled = true;
      }
    });
    form.querySelectorAll('input[type="file"]').forEach(input => { input.disabled = true; });
    form.querySelectorAll('.btn, .custom-control-input').forEach(ctrl => { ctrl.disabled = true; });
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) { submitButton.style.display = "none"; }
  } catch (err) {
    throw new Error(`Failed to set form to view mode: ${err.message}`);
  }
}

export function setDefaultDate() {
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `--`;
  }
}

export function setupEventListeners() {
  // Vehicle calculation
  const kmsInput = document.getElementById("kms");
  if (kmsInput) {
    kmsInput.addEventListener("input", calculateVehicleAmount);
  }
  
  // Add other expense row
  const addButton = document.querySelector('.btn-secondary');
  if (addButton) {
    addButton.addEventListener('click', addOtherExpenseRow);
  }
  
  // Remove rows (event delegation)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row')) {
      removeExpenseRow(e.target);
    }
  });
  
  // File input change tracking
  document.addEventListener('change', (e) => {
    if (e.target.type === 'file') {
      renderAttachmentFilenames(e.target);
    }
  }, true);
}

export function renderAttachmentFilenames(input) {
  let span = input.parentNode.querySelector('.attachment-filename');
  if (!span) {
    span = document.createElement('span');
    span.className = 'attachment-filename';
    input.parentNode.appendChild(span);
  }
  const files = input.files;
  if (files && files.length > 0) {
    span.textContent = Array.from(files).map(f => f.name).join(', ');
  } else {
    span.textContent = '';
  }
}
```

---

### **5. form-handler.js**
**Purpose**: Form submission and data collection

```javascript
// js/modules/form-handler.js
import { EXPENSE_TYPES } from './expense-types.js';
import { collectAttachments, logError } from './utils.js';
import { showAlert, setFormToViewMode } from './ui-handlers.js';
import { generatePDFBase64, mergeAttachmentsPDF } from './pdf-generator.js';

export async function handleFormSubmit(event, config) {
  event.preventDefault();
  const form = event.target;
  
  try {
    // Collect form data
    const formData = await collectFormData(form, config);
    
    // Submit based on config
    if (config.SUBMIT_INDIVIDUAL_LINE_ITEMS) {
      await submitIndividualItems(formData, config);
    } else {
      await submitBulk(formData, config);
    }
    
    showAlert("Successfully submitted expense claim.", "success");
    setFormToViewMode(form);
  } catch (error) {
    logError('Form submission failed', error);
    showAlert(`Failed to submit: ${error.message}`, "danger");
  }
}

async function collectFormData(form, config) {
  const data = {
    fullName: form.fullName?.value || "",
    employeeId: form.employeeId?.value || "",
    expenseDate: form.expenseDate?.value || ""
  };
  
  // Collect standard expenses
  data.standardExpenses = await collectStandardExpenses();
  
  // Collect other expenses
  data.otherExpenses = await collectOtherExpenses();
  
  // Collect vehicle data
  data.vehicle = {
    kms: parseFloat(form.kms?.value) || 0,
    rate: parseFloat(form.rate?.value) || 0,
    amount: parseFloat(form.vehicleAmount?.value) || 0,
    comment: form.vehicleComment?.value || ""
  };
  
  return data;
}

async function collectStandardExpenses() {
  const expenses = [];
  const rows = document.querySelectorAll("#StandardExpensesTable tbody tr");
  
  for (const row of rows) {
    const type = row.cells[0].textContent.trim();
    const amountInput = row.querySelector("input[type='number']");
    const fileInput = row.querySelector("input[type='file']");
    const amount = amountInput ? parseFloat(amountInput.value) || 0 : 0;
    
    if (amount > 0) {
      const attachments = await collectAttachments(fileInput);
      expenses.push({ type, amount, description: "", attachments });
    }
  }
  
  return expenses;
}

async function collectOtherExpenses() {
  const expenses = [];
  const rows = document.querySelectorAll("#otherExpensesBody tr");
  
  for (const row of rows) {
    const description = row.querySelector("input[name='other_description[]']")?.value || "";
    const amount = parseFloat(row.querySelector("input[name='other_amount[]']")?.value) || 0;
    
    if (amount > 0) {
      const attachmentInput = row.querySelector("input[name='other_attachment[]']");
      const attachments = await collectAttachments(attachmentInput);
      expenses.push({ type: "Other", amount, description, attachments });
    }
  }
  
  return expenses;
}

async function submitIndividualItems(formData, config) {
  const allItems = [...formData.standardExpenses, ...formData.otherExpenses];
  
  for (const item of allItems) {
    const payload = {
      varFlowEnvUpload: true,
      fullName: formData.fullName,
      employeeId: formData.employeeId,
      expenseDate: formData.expenseDate,
      expenseItems: [item]
    };
    
    const response = await fetch(config.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit item: ${item.type}`);
    }
  }
}

async function submitBulk(formData, config) {
  const payload = {
    varFlowEnvUpload: false,
    fullName: formData.fullName,
    employeeId: formData.employeeId,
    expenseDate: formData.expenseDate,
    lineItems: buildLineItemsJSON(formData)
  };
  
  // Generate summary PDF
  const pdfBase64 = await generatePDFBase64(formData);
  payload.summaryPdfAttachment = {
    filename: `Expense_Claim_Form_${formData.fullName}_${formData.expenseDate}.pdf`,
    content: pdfBase64
  };
  
  // Merge attachments
  const attachmentsPDF = await mergeAttachmentsPDF();
  if (attachmentsPDF) {
    payload.attachmentsPdf = {
      filename: `Expense_Claim_Form_Attachments_${formData.fullName}_${formData.expenseDate}.pdf`,
      content: attachmentsPDF
    };
  }
  
  const response = await fetch(config.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

function buildLineItemsJSON(formData) {
  const lineItems = [];
  
  // Standard expenses
  for (const expense of formData.standardExpenses) {
    const typeObj = EXPENSE_TYPES.find(t => t.name === expense.type);
    lineItems.push({
      description: expense.type,
      quantity: 1,
      amount: expense.amount,
      accountCode: typeObj?.accountCode || "",
      taxType: ""
    });
  }
  
  // Other expenses
  for (const expense of formData.otherExpenses) {
    lineItems.push({
      description: `Other Expenses - ${expense.description}`,
      quantity: 1,
      amount: expense.amount,
      accountCode: "",
      taxType: ""
    });
  }
  
  // Vehicle
  if (formData.vehicle.amount > 0) {
    lineItems.push({
      description: `Private Vehicle${formData.vehicle.comment ? ' - ' + formData.vehicle.comment : ''}`,
      quantity: 1,
      amount: formData.vehicle.amount,
      accountCode: "481",
      taxType: ""
    });
  }
  
  return JSON.stringify(lineItems, null, 2);
}
```

---

### **6. pdf-generator.js**
**Purpose**: PDF generation and manipulation

```javascript
// js/modules/pdf-generator.js
import { sanitizeFilename, logError } from './utils.js';

export async function generatePDFBase64(formData) {
  const main = document.querySelector('main.container');
  if (main) main.classList.add('print-friendly');
  
  window.scrollTo(0, 0);
  const element = document.querySelector('.container');
  const filename = `Expense_Claim_Form_${sanitizeFilename(formData.fullName)}_${formData.expenseDate}.pdf`;
  
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  return new Promise((resolve, reject) => {
    html2pdf().set(opt).from(element).outputPdf('datauristring')
      .then(dataUri => {
        if (main) main.classList.remove('print-friendly');
        const base64 = dataUri.split(',')[1];
        resolve(base64);
      })
      .catch(err => {
        if (main) main.classList.remove('print-friendly');
        reject(err);
      });
  });
}

export async function downloadPDF() {
  try {
    const main = document.querySelector('main.container');
    if (main) main.classList.add('print-friendly');
    
    window.scrollTo(0, 0);
    const element = document.querySelector('.container');
    
    const name = sanitizeFilename(document.getElementById('fullName')?.value || 'Unknown');
    const date = document.getElementById('expenseDate')?.value || 'Unknown';
    const filename = `Expense_Claim_Form_${name}_${date}.pdf`;
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    await html2pdf().set(opt).from(element).save();
    if (main) main.classList.remove('print-friendly');
  } catch (err) {
    logError('PDF download failed', err);
    const main = document.querySelector('main.container');
    if (main) main.classList.remove('print-friendly');
    throw err;
  }
}

export async function mergeAttachmentsPDF() {
  const allFiles = [];
  document.querySelectorAll('input[type="file"]').forEach(input => {
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        allFiles.push(input.files[i]);
      }
    }
  });
  
  if (allFiles.length === 0) return null;
  
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error('jsPDF library not loaded');
  }
  
  const doc = new jsPDF();
  let firstPage = true;
  
  for (const file of allFiles) {
    if (!firstPage) doc.addPage();
    firstPage = false;
    
    try {
      if (file.type.startsWith('image/')) {
        const imgData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        doc.addImage(imgData, 'JPEG', 10, 10, 180, 250);
        doc.text(file.name, 10, 265);
      } else {
        doc.text(`[File: ${file.name}]`, 10, 20);
      }
    } catch (err) {
      logError(`Failed to process attachment: ${file.name}`, err);
      doc.text(`[Error reading file: ${file.name}]`, 10, 20);
    }
  }
  
  return doc.output('datauristring').split(',')[1];
}
```

---

### **7. app.js** (Main Entry Point)
**Purpose**: Initialize and coordinate all modules

```javascript
// js/app.js
import { loadConfig, validateConfig } from './modules/config-loader.js';
import { generateExpenseTable, setDefaultDate, setupEventListeners, showAlert } from './modules/ui-handlers.js';
import { handleFormSubmit } from './modules/form-handler.js';
import { downloadPDF } from './modules/pdf-generator.js';

let CONFIG = null;

async function initApp() {
  try {
    // Load configuration
    CONFIG = await loadConfig();
    validateConfig(CONFIG);
    
    // Initialize UI
    generateExpenseTable();
    setDefaultDate();
    setupEventListeners();
    
    // Setup form submission
    const form = document.getElementById('expenseForm');
    if (form) {
      form.addEventListener('submit', (e) => handleFormSubmit(e, CONFIG));
    }
    
    // Setup PDF download
    const pdfButton = document.querySelector('button[onclick="saveAsPDF()"]');
    if (pdfButton) {
      pdfButton.removeAttribute('onclick');
      pdfButton.addEventListener('click', downloadPDF);
      
      // Hide in debug mode
      if (CONFIG.DEBUG_MODE === 'DEBUG') {
        pdfButton.style.display = 'none';
      }
    }
    
  } catch (err) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">Failed to load application. Please contact support.</div></div>';
    console.error('App initialization failed:', err);
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
```

---

### **8. Updated index.html** (Minimal Structure)

```html
<!DOCTYPE html>
<html lang="en-NZ">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Claim Submission Form</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <main class="container mt-5" role="main">
        <h2>Expense Claim Submission</h2>
        <form id="expenseForm" autocomplete="off" aria-label="Expense Claim Form">
            <!-- Form content remains the same -->
        </form>
        <div id="attachmentsError" class="alert alert-danger mt-2 d-none"></div>
        <button type="button" class="btn btn-primary">Download as PDF</button>
        <div id="alert-container" class="mt-3" role="alert"></div>
    </main>
    
    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- Application Code -->
    <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

## Implementation Roadmap

### Phase 1: Extract CSS (Low Risk)
1. Create `css/styles.css`
2. Move all `<style>` content to external file
3. Link in HTML
4. Test in all browsers

### Phase 2: Create Utility Modules (Low Risk)
1. Create `js/modules/utils.js`
2. Extract utility functions
3. Create `js/modules/expense-types.js`
4. Extract expense type definitions

### Phase 3: Create UI Module (Medium Risk)
1. Create `js/modules/ui-handlers.js`
2. Extract DOM manipulation functions
3. Remove inline event handlers
4. Test all UI interactions

### Phase 4: Create Business Logic Modules (Medium Risk)
1. Create `js/modules/config-loader.js`
2. Create `js/modules/form-handler.js`
3. Create `js/modules/pdf-generator.js`
4. Test form submission and PDF generation

### Phase 5: Create Main App (High Risk)
1. Create `js/app.js`
2. Wire up all modules
3. Remove old code from `index.html`
4. Full regression testing

### Phase 6: Optimization (Optional)
1. Add build process (Vite, Webpack)
2. Minify and bundle
3. Add source maps
4. Implement lazy loading

---

## Testing Strategy

### Unit Tests (New Capability)
With modular code, you can use Vitest or Jest:

```javascript
// test/utils.test.js
import { sanitizeFilename, formatDate } from '../js/modules/utils.js';

describe('sanitizeFilename', () => {
  test('removes special characters', () => {
    expect(sanitizeFilename('John Doe!')).toBe('John_Doe_');
  });
});
```

### Integration Tests
Test module interactions:

```javascript
// test/form-handler.test.js
import { collectFormData } from '../js/modules/form-handler.js';

describe('collectFormData', () => {
  test('collects all form fields', async () => {
    // Mock form data
    const result = await collectFormData(mockForm, mockConfig);
    expect(result.fullName).toBe('John Doe');
  });
});
```

### End-to-End Tests
Use Playwright or Cypress:

```javascript
// e2e/form-submission.spec.js
test('submit expense claim', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.fill('#fullName', 'John Doe');
  await page.fill('#employeeId', 'EMP123');
  // ... fill more fields
  await page.click('button[type=submit]');
  await expect(page.locator('.alert-success')).toBeVisible();
});
```

---

## Benefits Summary

### Before Modularization
-  700+ lines in one file
-  Hard to test
-  Global scope pollution
-  Tight coupling
-  Difficult to maintain

### After Modularization
-  ~100 lines per module
-  Unit testable
-  Encapsulated modules
-  Loose coupling
-  Easy to maintain and extend

---

## Migration Path

### Option A: Big Bang (Not Recommended)
- Refactor everything at once
- High risk of breaking things
- Difficult to track issues

### Option B: Gradual Migration (Recommended)
1. Keep current `index.html` working
2. Extract one module at a time
3. Test after each extraction
4. Run both old and new in parallel initially
5. Switch over when confident

### Option C: Feature Flags
```javascript
const USE_MODULAR_CODE = false;

if (USE_MODULAR_CODE) {
  import('./js/app.js');
} else {
  // Run existing code
}
```

---

## Conclusion

Modularizing the NZNO Expense Claim Form will significantly improve code quality, maintainability, and scalability. The recommended approach is a **gradual migration** starting with low-risk modules (CSS, utilities) and progressively refactoring more complex areas.

**Next Steps:**
1. Review this document with the team
2. Decide on migration strategy
3. Create feature branch for modularization
4. Start with Phase 1 (Extract CSS)
5. Set up automated testing framework
6. Gradually migrate remaining code

**Estimated Effort:**
- Phase 1-2: 4-8 hours
- Phase 3-4: 8-16 hours
- Phase 5: 8-12 hours
- Testing & QA: 8-16 hours
- **Total: 28-52 hours**

---

**Document Author**: AI Code Review Assistant  
**Date**: October 28, 2025  
**For**: NZNO Expense Claim Form Project
