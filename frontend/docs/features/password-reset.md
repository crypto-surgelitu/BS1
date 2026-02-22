# Feature: Password Reset Flow

**Type:** Security + UX  
**Priority:** High  
**Sprint:** 2  
**Status:** ✅ Implemented

---

## Overview

A secure "forgot password" flow that lets users reset their password via a time-limited 6-digit PIN sent to their email, without exposing whether an email is registered (prevents email enumeration).

## How It Works

```
1. User clicks "Forgot Password" → enters email
2. Server looks up email (always returns success to prevent enumeration)
3. If email exists: generates 6-digit PIN using crypto.randomInt(), stores with 15-minute expiry
4. Reset PIN sent via email
5. User enters PIN + new password
6. Server validates PIN (not expired, exists in DB)
7. Password hashed with bcrypt (12 rounds) and updated
8. PIN cleared, failed_login_attempts reset
9. Confirmation email sent
```

## Database Changes

```sql
ALTER TABLE users
    ADD COLUMN password_reset_token VARCHAR(128) DEFAULT NULL,
    ADD COLUMN password_reset_expires DATETIME DEFAULT NULL;
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/forgot-password` | Request password reset PIN |
| POST | `/auth/reset-password-pin` | Reset password with PIN |
| POST | `/auth/reset-password` | Reset password with token (legacy) |

## Security Features

| Feature | Implementation |
|---------|---------------|
| PIN Generation | `crypto.randomInt(100000, 999999)` - cryptographically secure |
| PIN Expiry | 15 minutes |
| Email Enumeration Prevention | Always returns same success message |
| PIN Logging | PIN never logged to console (security fix applied) |
| Session Invalidation | All sessions revoked on password change |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| `ForgotPassword.jsx` | `/forgot-password` | Email input form |
| `ResetPassword.jsx` | `/reset-password` | PIN input + new password form |

## Security Impact

| Risk | Mitigation |
|------|------------|
| Email enumeration | Always returns same success message |
| PIN brute force | 6-digit PIN with 15-minute expiry, rate limited |
| Weak new passwords | Requires 8+ chars with uppercase, lowercase, number, special char |
| Account takeover | Old sessions invalidated on reset |

## UX Impact

- PIN-based reset (faster than email link)
- Live password strength indicators on the reset page (uppercase, lowercase, number, special char)
- Clear success/error states with appropriate icons
- Auto-redirect to login after successful reset
- "Request new PIN" option if PIN is invalid/expired
- Confirmation email sent after successful reset
