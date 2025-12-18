# Zapier + Xero Integration Guide

This guide covers integrating the NZNO Expense Claim application with Xero via Zapier webhooks.

## Quick Setup (5 Minutes)

### 1. Application Configuration

Update `config.json`:
```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": false,
  "STRINGIFY_LINE_ITEMS_FOR_ZAPIER": true,
  "API_URL": "https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/",
  "DEBUG_MODE": "PRODUCTION"
}
```

**Key setting**: `STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true` sends line items as Base64-encoded JSON to prevent Zapier from auto-flattening the array.

### 2. Zapier Webhook Setup

1. Create new Zap > **Webhooks by Zapier** > **Catch Hook**
2. **Leave Child Key empty**
3. Copy the webhook URL to your `config.json`
4. Test: Submit an expense claim, then click "Test trigger" in Zapier

### 3. Code by Zapier Action

Add action > **Code by Zapier** > **Run JavaScript** (TypeScript)

**Input Configuration:**
| Field | Value |
|-------|-------|
| `supplierName` | `{{1. Full Name}}` |
| `date` | `{{1. Expense Date}}` |
| `lineItems` | `{{1. Line Items}}` |
| `attachments` | `{{1. Attachments}}` |

**Code:**
```typescript
// Define an async function to create a bill (purchase) in Xero with dynamic line items and optional attachments
export async function createXeroBill({
  supplierName,
  date,
  lineItems,
  attachments
}: {
  supplierName: string;
  date: string;
  lineItems: string;
  attachments?: string; // Optional attachments parameter
}): Promise<{ result: string }> {
  // Decode Base64 and parse the lineItems string into an array
  const decodedLineItems = atob(lineItems);
  const parsedLineItems = JSON.parse(decodedLineItems) as {
    description: string;
    quantity: number;
    amount: number;
    accountCode: string;
    taxType: string;
  }[];

  // Validate line items exist
  if (!Array.isArray(parsedLineItems) || parsedLineItems.length === 0) {
    throw new Error('No line items found');
  }

  // Parse the attachments if provided
  let parsedAttachments: {
    fileName: string;
    mimeType: string;
    content: string; // Base64 encoded content
  }[] = [];

  if (attachments) {
    const decodedAttachments = atob(attachments);
    parsedAttachments = JSON.parse(decodedAttachments);
  }

  // Base URL for the Xero API
  const identityBaseUrl = 'https://api.xero.com';
  const accountingBaseUrl = 'https://api.xero.com/api.xro/2.0';

  // Step 1: Retrieve a list of tenant IDs using the connections API
  const connectionsUrl = `${identityBaseUrl}/Connections`;
  const connectionsResponse = await fetchWithZapier(connectionsUrl, {
    method: 'GET',
  });

  // Check if the response is OK, otherwise throw an error
  await connectionsResponse.throwErrorIfNotOk();

  // Parse the response to get the list of connections
  const connections = await connectionsResponse.json();
  if (!connections || connections.length === 0) {
    throw new Error('No tenant connections found.');
  }

  // Use the first tenant ID from the list
  const tenantId = connections[0].tenantId;

  // Construct the URL for the Xero API endpoint
  const url = `${accountingBaseUrl}/Invoices`;

  // Map the line items to the format required by the Xero API
  const formattedLineItems = parsedLineItems.map(item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.amount,
    AccountCode: item.accountCode, // Use the provided account code
    TaxType: item.taxType, // Use the provided tax type
    LineAmount: item.amount * item.quantity
  }));

  // Define the request body with the bill details
  const requestBody = {
    Invoices: [
      {
        Type: 'ACCPAY', // Type for a bill (purchase)
        Contact: {
          Name: supplierName // Supplier name
        },
        Date: date, // Date of the bill
        LineItems: formattedLineItems,
        LineAmountTypes: 'Inclusive' // Line amounts are tax inclusive
      }
    ]
  };

  // Make the API request to create the bill
  const response = await fetchWithZapier(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'xero-tenant-id': tenantId // Use the retrieved tenant ID
    },
    body: JSON.stringify(requestBody)
  });

  // Throw an error if the response is not OK
  await response.throwErrorIfNotOk();

  // Parse the response to get the created invoice ID
  const responseData = await response.json();
  const invoiceId = responseData.Invoices[0].InvoiceID;

  // If attachments are provided, upload them
  if (parsedAttachments.length > 0) {
    for (const attachment of parsedAttachments) {
      // Decode base64 to binary using Uint8Array (more portable than Buffer in Zapier)
      const binaryString = atob(attachment.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const attachmentUrl = `${accountingBaseUrl}/Invoices/${invoiceId}/Attachments/${attachment.fileName}`;
      const attachmentResponse = await fetchWithZapier(attachmentUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': attachment.mimeType,
          'xero-tenant-id': tenantId,
          'Content-Length': bytes.length.toString()
        },
        body: bytes
      });

      // Throw an error if the attachment upload response is not OK
      await attachmentResponse.throwErrorIfNotOk();
    }
  }

  // Return a success message
  return { result: 'Bill (purchase) created successfully with attachments' };
}
```

### 4. Test and Activate

1. Click "Test action" in Zapier
2. Verify bill appears in Xero with all line items
3. Turn on the Zap

---

## Payload Reference

### Full Webhook Payload
```json
{
  "fullName": "James McNeil",
  "employeeId": "123456",
  "expenseDate": "2025-11-18",
  "varFlowEnvUpload": false,
  "lineItems": "W3siZGVzY3Jp...",
  "attachments": "W3siZmlsZU5...",
  "summaryPdfAttachment": {
    "filename": "Expense_Claim_Form_James_McNeil_2025_11_18.pdf",
    "content": "JVBERi0xLjMK..."
  }
}
```

### Line Item Structure (decoded)
```json
{
  "description": "Flights",
  "quantity": 1,
  "amount": 100.00,
  "accountCode": "480",
  "taxType": ""
}
```

### Account Code Reference
| Expense Type | Account Code |
|--------------|--------------|
| Flights | 480 |
| Private Vehicle | 481 |
| Rental Car | 486 |
| Fares - Bus/Rail | 476 |
| Taxi/Uber | 482 |
| Parking | 482 |
| Accommodation | 484 |
| Meals | 484 |
| Other Expenses | (empty) |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "No tenant connections found" | Xero not authenticated | Re-connect Xero in Zapier |
| Line items not appearing | Config incorrect | Verify `STRINGIFY_LINE_ITEMS_FOR_ZAPIER: true` |
| Flattened fields in Zapier | Old cached data | Submit new test after config change |
| Attachments not decoding/corrupted | Buffer not supported in Zapier | Use `Uint8Array` instead of `Buffer.from()` (see code above) |
| Attachments not uploading | Wrong encoding | Verify Base64 content and `.pdf` extension |
| Invalid account code | Code not in Xero | Check Xero Chart of Accounts |

---

## Configuration Options

### For Xero Integration (Recommended)
```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": false,
  "STRINGIFY_LINE_ITEMS_FOR_ZAPIER": true
}
```
Creates single bill with all line items.

### For Child Key Iteration (Alternative)
```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": false,
  "STRINGIFY_LINE_ITEMS_FOR_ZAPIER": false
}
```
Use Zapier child key `lineItems` to iterate. Note: Parent fields not accessible per item.

### For Individual Submissions
```json
{
  "SUBMIT_INDIVIDUAL_LINE_ITEMS": true
}
```
Sends each line item as separate POST request.

---

## Support

- **Zapier issues**: [Zapier Help](https://zapier.com/help)
- **Xero API**: [Xero Developer Docs](https://developer.xero.com/documentation/api/accounting/overview)
- **Application issues**: Check browser console for errors
