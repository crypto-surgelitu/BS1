# Feature: CSRF Protection

**Type:** Security  
**Priority:** Critical  
**Sprint:** 2  
**Status:** ✅ Implemented

---

## What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack where a malicious website tricks a logged-in user's browser into making unwanted requests to your application. For example, a user logged into the booking system visits a malicious site that silently submits a booking cancellation on their behalf.

## How It Works in BS1

BS1 uses the **Double Submit Cookie** pattern — the modern, recommended approach for stateless JWT-based APIs:

```
1. Server sets a `csrf_token` cookie (readable by JavaScript)
2. Frontend reads the cookie and sends it as `X-CSRF-Token` header
3. Server compares cookie value vs header value using timing-safe comparison
4. If they match → request is allowed; if not → 403 Forbidden
```

This works because malicious sites cannot read cookies from a different domain (same-origin policy), so they can't forge the header.

## Files Changed

| File | Change |
|------|--------|
| `backend/middleware/csrf.js` | New - CSRF middleware (double-submit cookie) |
| `backend/server.js` | Added `setCsrfToken` middleware, `GET /api/csrf-token` endpoint |
| `backend/package.json` | Added `cookie-parser` |

## API Endpoint

```
GET /api/csrf-token
Response: { "csrfToken": "<64-char hex string>" }
```

## Frontend Integration

```javascript
// Get CSRF token before any state-changing request
const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());

// Include in all POST/PUT/DELETE requests
fetch('/book', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(bookingData)
});
```

## Security Impact

| Before | After |
|--------|-------|
| No CSRF protection | Double-submit cookie pattern |
| Vulnerable to cross-site form submissions | All state-changing requests validated |
| Any site could forge requests | Timing-safe token comparison |

## Why Not `csurf`?

The `csurf` npm package is deprecated. The double-submit cookie pattern using Node's built-in `crypto` module is more secure, has no dependencies, and is the OWASP-recommended approach for stateless APIs.
