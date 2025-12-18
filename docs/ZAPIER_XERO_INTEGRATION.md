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
export async function createXeroBill({
  supplierName,
  date,
  lineItems,
  attachments
}: {
  supplierName: string;
  date: string;
  lineItems: string;
  attachments?: string;
}): Promise<{ result: string }> {
  // Decode Base64 and parse line items
  const decodedLineItems = atob(lineItems);
  const parsedLineItems = JSON.parse(decodedLineItems) as {
    description: string;
    quantity: number;
    amount: number;
    accountCode: string;
    taxType: string;
  }[];

  if (!Array.isArray(parsedLineItems) || parsedLineItems.length === 0) {
    throw new Error('No line items found');
  }

  // Parse attachments if provided
  let parsedAttachments: { fileName: string; mimeType: string; content: string }[] = [];
  if (attachments) {
    parsedAttachments = JSON.parse(atob(attachments));
  }

  // Get Xero tenant
  const connectionsResponse = await fetchWithZapier('https://api.xero.com/Connections', { method: 'GET' });
  await connectionsResponse.throwErrorIfNotOk();
  const connections = await connectionsResponse.json();

  if (!connections?.length) throw new Error('No Xero tenant connections found');
  const tenantId = connections[0].tenantId;

  // Create bill
  const formattedLineItems = parsedLineItems.map(item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.amount,
    AccountCode: item.accountCode,
    TaxType: item.taxType || 'NONE',
    LineAmount: item.amount * item.quantity
  }));

  const response = await fetchWithZapier('https://api.xero.com/api.xro/2.0/Invoices', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'xero-tenant-id': tenantId
    },
    body: JSON.stringify({
      Invoices: [{
        Type: 'ACCPAY',
        Contact: { Name: supplierName },
        Date: date,
        LineItems: formattedLineItems,
        LineAmountTypes: 'Inclusive'
      }]
    })
  });

  await response.throwErrorIfNotOk();
  const responseData = await response.json();
  const invoiceId = responseData.Invoices[0].InvoiceID;

  // Upload attachments
  for (const attachment of parsedAttachments) {
    // Decode base64 to binary using Uint8Array (more portable than Buffer in Zapier)
    const binaryString = atob(attachment.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const attachmentResponse = await fetchWithZapier(
      `https://api.xero.com/api.xro/2.0/Invoices/${invoiceId}/Attachments/${attachment.fileName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': attachment.mimeType,
          'xero-tenant-id': tenantId,
          'Content-Length': bytes.length.toString()
        },
        body: bytes
      }
    );
    await attachmentResponse.throwErrorIfNotOk();
  }

  return { result: 'Bill created successfully' };
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
