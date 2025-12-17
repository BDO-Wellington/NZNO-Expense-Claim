/**
 * Mock API Server for Testing
 * Captures expense claim submissions and logs them to console
 *
 * Only runs in development mode (not production)
 */

// Check if running in production
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  Mock server disabled in production mode');
  process.exit(0);
}

const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Handle form submission
    if (url.pathname === '/api/submit' && req.method === 'POST') {
      try {
        const body = await req.text();
        const data = JSON.parse(body);

        console.log('\n' + '='.repeat(60));
        console.log('📥 EXPENSE CLAIM SUBMISSION RECEIVED');
        console.log('='.repeat(60));
        console.log('Timestamp:', new Date().toISOString());
        console.log('\n📋 Form Data:');
        console.log('  Full Name:', data.fullName);
        console.log('  Employee ID:', data.employeeId);
        console.log('  Expense Date:', data.expenseDate);

        // Decode and display line items
        if (data.lineItems) {
          console.log('\n💰 Line Items:');
          let lineItems;
          if (typeof data.lineItems === 'string') {
            // Base64 encoded
            lineItems = JSON.parse(atob(data.lineItems));
          } else {
            lineItems = data.lineItems;
          }
          lineItems.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.description}: $${item.amount} (Account: ${item.accountCode})`);
          });
        }

        // Display attachments info
        if (data.attachments) {
          console.log('\n📎 Attachments:');
          let attachments;
          if (typeof data.attachments === 'string') {
            attachments = JSON.parse(atob(data.attachments));
          } else {
            attachments = data.attachments;
          }
          attachments.forEach((att, i) => {
            const sizeKB = att.content ? Math.round(att.content.length * 0.75 / 1024) : 0;
            console.log(`  ${i + 1}. ${att.fileName} (${att.mimeType}) - ~${sizeKB}KB`);
          });
        }

        console.log('\n✅ Submission accepted successfully!');
        console.log('='.repeat(60) + '\n');

        return new Response(JSON.stringify({ success: true, message: 'Expense claim received' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('❌ Error processing submission:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Default 404
    return new Response('Not Found', { status: 404 });
  },
});

console.log('🚀 Mock API Server running at http://localhost:8000');
console.log('📍 Endpoint: POST http://localhost:8000/api/submit');
console.log('Waiting for submissions...\n');
