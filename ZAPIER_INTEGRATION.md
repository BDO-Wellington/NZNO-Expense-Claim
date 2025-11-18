# Zapier Webhooks Integration Guide

## Overview
This document provides instructions for integrating the NZNO Expense Claim application with Zapier using the "Webhooks by Zapier" trigger.

## Webhook Configuration

### Step 1: Set Up Zapier Webhook
1. Create a new Zap in Zapier
2. Choose **"Webhooks by Zapier"** as the trigger
3. Select **"Catch Hook"** as the event
4. Copy the webhook URL provided by Zapier

### Step 2: Configure Your Application
1. Open `config.json` in your application root directory
2. Update the `API_URL` field with your Zapier webhook URL:
```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": false,
  "API_URL": "https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/",
  "DEBUG_MODE": "PRODUCTION"
}
```

## Understanding Child Keys

### What is a Child Key?
By default, Zapier receives the entire webhook payload as a single trigger. The **child key** feature allows Zapier to iterate over an array within your payload, running your Zap once for each array item.

### Recommended Configuration

**For processing individual line items:**
- **Child Key**: `lineItems`

This configuration will:
- Run your Zap once for each expense line item
- Make each line item's data available as individual fields in Zapier
- Allow you to process expenses separately (e.g., create individual records in accounting software)

**For processing the entire submission as one:**
- **Child Key**: Leave empty or don't specify

This configuration will:
- Run your Zap once per form submission
- Process all line items together
- Ideal for creating a single comprehensive record

## Payload Structure

### Full Payload (when child key is NOT used)

```json
{
  "fullName": "James McNeil",
  "employeeId": "123456",
  "expenseDate": "2025-11-18",
  "varFlowEnvUpload": false,
  "lineItems": [
    {
      "description": "Flights",
      "quantity": 1,
      "amount": 100.00,
      "accountCode": "480",
      "taxType": ""
    },
    {
      "description": "Other Expenses - Conference Registration",
      "quantity": 1,
      "amount": 250.00,
      "accountCode": "",
      "taxType": ""
    },
    {
      "description": "Private Vehicle",
      "quantity": 1,
      "amount": 208.00,
      "accountCode": "481",
      "taxType": ""
    }
  ],
  "summaryPdfAttachment": {
    "filename": "Expense_Claim_Form_James_McNeil_2025_11_18.pdf",
    "content": "JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9Q..."
  },
  "attachmentsPdf": {
    "filename": "Attachments_James_McNeil_2025_11_18.pdf",
    "content": "JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9Q..."
  }
}
```

### Individual Line Item (when child key = "lineItems")

When you specify `lineItems` as the child key, Zapier will trigger once for each item with this structure:

```json
{
  "description": "Flights",
  "quantity": 1,
  "amount": 100.00,
  "accountCode": "480",
  "taxType": ""
}
```

**Important**: When using child key iteration, the parent-level fields (`fullName`, `employeeId`, etc.) may not be directly accessible. Consider these approaches:

1. **Don't use child key** - Process all line items in a single Zap action
2. **Use Code by Zapier** - Process the array within a Zap step
3. **Flatten the structure** - Modify the payload to include employee details in each line item (requires code changes)

## Available Fields

### Top-Level Fields
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `fullName` | String | Employee's full name | "James McNeil" |
| `employeeId` | String | Employee ID number | "123456" |
| `expenseDate` | String | Date of expense claim | "2025-11-18" |
| `varFlowEnvUpload` | Boolean | Internal flag (always false for bulk) | false |
| `lineItems` | Array | Array of expense line items | See below |
| `summaryPdfAttachment` | Object | PDF summary document | See below |
| `attachmentsPdf` | Object | Merged attachments PDF | See below |

### Line Item Fields
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `description` | String | Description of the expense | "Flights" |
| `quantity` | Number | Quantity (always 1 currently) | 1 |
| `amount` | Number | Amount in dollars | 100.00 |
| `accountCode` | String | Accounting code (if applicable) | "480" |
| `taxType` | String | Tax type (currently empty) | "" |

### PDF Attachment Fields
Both `summaryPdfAttachment` and `attachmentsPdf` contain:
| Field Name | Type | Description |
|------------|------|-------------|
| `filename` | String | Name of the PDF file |
| `content` | String | Base64-encoded PDF content |

## Common Zapier Use Cases

### Use Case 1: Create Individual Accounting Entries

**Child Key**: `lineItems`

**Zap Actions**:
1. Trigger: Webhooks by Zapier (Catch Hook)
2. Action: Create entry in accounting software (e.g., Xero, QuickBooks)
   - Map `description` to line item description
   - Map `amount` to amount field
   - Map `accountCode` to account/category

**Limitation**: Parent fields not accessible per line item

### Use Case 2: Create Single Expense Report

**Child Key**: Leave empty

**Zap Actions**:
1. Trigger: Webhooks by Zapier (Catch Hook)
2. Action: Code by Zapier (JavaScript)
   - Parse the `lineItems` array
   - Calculate total amount
   - Format data as needed
3. Action: Create expense report in your system
   - Include employee details
   - Attach summary PDF
   - Include all line items

### Use Case 3: Email Notification with PDF

**Child Key**: Leave empty

**Zap Actions**:
1. Trigger: Webhooks by Zapier (Catch Hook)
2. Action: Email by Zapier
   - To: Accounts payable team
   - Subject: "New Expense Claim: {{fullName}}"
   - Body: Include expense details
   - Attachments: Decode and attach PDFs

## Working with PDF Attachments in Zapier

PDF files are sent as **Base64-encoded strings**. To use them in Zapier:

### Method 1: Using Code by Zapier
```javascript
// Convert Base64 to file
const pdfContent = inputData.summaryPdfAttachment.content;
const pdfFilename = inputData.summaryPdfAttachment.filename;

// Return as file object for next step
output = {
  file: pdfContent,
  filename: pdfFilename,
  contentType: 'application/pdf'
};
```

### Method 2: Using Formatter by Zapier
1. Add a "Formatter by Zapier" step
2. Choose "Text" as the event
3. Transform: Select "Convert Base64 to File"
4. Input: Select the `content` field from your PDF attachment
5. Filename: Select the `filename` field

## Testing Your Integration

### Step 1: Test the Webhook
1. In Zapier, after setting up your trigger, click "Test Trigger"
2. Submit a test expense claim in your application
3. Zapier should catch the webhook data

### Step 2: Verify the Data
Check that all expected fields are present:
- Employee information (fullName, employeeId, expenseDate)
- Line items array (if not using child key)
- Individual line item fields (if using child key)
- PDF attachments (if needed)

### Step 3: Test the Full Zap
1. Turn on your Zap
2. Submit a real expense claim
3. Verify the data appears correctly in your destination system

## Troubleshooting

### Issue: No data received in Zapier
**Solution**:
- Verify the webhook URL is correctly configured in `config.json`
- Check browser console for errors during submission
- Ensure `SUBMIT_INDIVIDUAL_LINE_ITEMS` is set to `false` in config.json

### Issue: Line items not iterating
**Solution**:
- Ensure child key is set to exactly `lineItems` (case-sensitive)
- Verify the webhook is catching the data correctly
- Make sure `lineItems` is sent as an array, not a JSON string

### Issue: PDF attachments not working
**Solution**:
- Verify PDFs are Base64 encoded strings
- Use Code by Zapier or Formatter to convert Base64 to file
- Check that the PDF generation didn't fail (check browser console)

### Issue: Parent fields not available with child key
**Solution**:
- This is expected behavior with child key iteration
- Either don't use child key and process in a Code step, OR
- Modify the code to include parent fields in each line item

## Advanced: Including Parent Data in Line Items

If you need both line item iteration AND parent data, modify `buildLineItemsArray()` in `form-handler.js`:

```javascript
function buildLineItemsArray(expenseItems, vehicleData, formData) {
  const lineItems = [];

  expenseItems.forEach(item => {
    if (item.amount > 0) {
      const description = item.type === 'Other'
        ? `Other Expenses - ${item.description}`
        : item.type;

      lineItems.push({
        // Line item fields
        description,
        quantity: 1,
        amount: item.amount,
        accountCode: item.accountCode || '',
        taxType: '',
        // Include parent data
        employeeName: formData.fullName,
        employeeId: formData.employeeId,
        expenseDate: formData.expenseDate
      });
    }
  });

  // ... rest of function
}
```

Then update the `submitBulk()` function call to include formData:
```javascript
const lineItemsArray = buildLineItemsArray(expenseItems, vehicleData, formData);
```

## Support

For issues specific to:
- **Zapier webhook setup**: Contact Zapier support
- **Application integration**: Check browser console for errors
- **Payload structure**: Review this documentation

## Changelog

### 2025-11-18
- Updated `lineItems` to send as array instead of JSON string for Zapier child key compatibility
- Added `Content-Type: application/json` header to fetch requests
- Created comprehensive integration documentation
