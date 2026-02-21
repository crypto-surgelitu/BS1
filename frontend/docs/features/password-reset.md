# Feature: Password Reset Flow

**Type:** Security + UX  
**Priority:** High  
**Sprint:** 2  
**Status:** ✅ Implemented

---

## Overview

A secure "forgot password" flow that lets users reset their password via a time-limited email link, without exposing whether an email is registered (prevents email enumeration).

## How It Works

```
1. User clicks "Forgot Password" → enters email
2. Server looks up email (always returns success to prevent enumeration)
3. If email exists: generates 32-byte token, stores with 1-hour expiry
4. Reset email sent with link: /reset-password?token=<token>
5. User clicks link → enters new password
6. Server validates token (not expired, exists in DB)
7. Password hashed with bcrypt (12 rounds) and updated
8. Token cleared, failed_login_attempts reset
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
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| `ForgotPassword.jsx` | `/forgot-password` | Email input form |
| `ResetPassword.jsx` | `/reset-password?token=...` | New password form with live strength indicators |

## Security Impact

| Risk | Mitigation |
|------|------------|
| Email enumeration | Always returns same success message |
| Token brute force | 32-byte random token, 1-hour expiry |
| Token reuse | Token cleared after successful reset |
| Weak new passwords | Same complexity rules enforced |
| Account takeover | Old sessions invalidated on reset |

## UX Impact

- Live password strength indicators on the reset page (uppercase, lowercase, number, special char)
- Clear success/error states with appropriate icons
- Auto-redirect to login 3 seconds after successful reset
- "Request new link" option if token is invalid/expired
- Confirmation email sent after successful reset
