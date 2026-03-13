# Security Improvements

## Completed

- **robots.txt + noindex meta tag** — prevents search engine indexing/discovery of the form
- **Honeypot field** — hidden form field that catches generic bot submissions

## Future Improvements

### 1. Zapier Header Validation (Low effort)

Add a custom header (e.g. `X-Form-Token`) to all submissions from the form. Configure a Zapier Filter step to return 404 if the header is missing.

This doesn't fully protect the webhook (the header value is visible in client-side code), but it stops casual abuse from someone who only has the webhook URL without inspecting the form source.

### 2. Fullstack App (High effort, best long-term solution)

Replace the static GitHub Pages site with a fullstack application (e.g. ASP.NET backend). This would allow:

- **Server-side webhook secret** — the Zapier/Xero API key never leaves the server
- **Server-side validation** — reject malformed or suspicious payloads before they reach downstream systems
- **Rate limiting** — enforce per-IP or per-session submission limits
- **Admin panel** — approve/deny claims before they're processed
- **Dashboard** — reporting and insights on submitted claims
- **Authentication** — optional login for staff, token-based links for external users

### 3. Lightweight Proxy (Medium effort, good middle-ground)

If a full rewrite isn't feasible, a thin proxy (e.g. Cloudflare Worker, Azure Function) could sit between the form and Zapier to provide:

- Webhook URL hidden server-side
- Rate limiting
- CAPTCHA validation (e.g. Cloudflare Turnstile)
- Basic payload validation

This preserves the current static site while closing the biggest gap (exposed webhook).
