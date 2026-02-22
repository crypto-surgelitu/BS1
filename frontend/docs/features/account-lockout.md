# Feature: Account Lockout Mechanism

**Type:** Security  
**Priority:** High  
**Sprint:** 2  
**Status:** ✅ Implemented

---

## Overview

Automatically locks user accounts after 15 consecutive failed login attempts for 10 minutes. This prevents brute-force password attacks while minimizing disruption to legitimate users.

## How It Works

```
1. User attempts login with wrong password
2. failed_login_attempts counter incremented in DB
3. After 5 failures: locked_until set to NOW() + 30 minutes
4. Subsequent login attempts return 423 Locked with time remaining
5. Successful login: counter reset to 0, locked_until cleared
6. Password reset also clears the lockout
```

## Database Changes

```sql
ALTER TABLE users
    ADD COLUMN failed_login_attempts INT DEFAULT 0,
    ADD COLUMN locked_until DATETIME DEFAULT NULL;
```

## Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max attempts | 15 | High threshold to reduce false positives |
| Lockout duration | 10 minutes | Balances security vs. user inconvenience |
| Reset on success | Yes | Prevents legitimate users from being locked out |
| Reset on password change | Yes | Allows recovery via password reset |

## API Response (423 Locked)

```json
{
    "error": "Account temporarily locked due to too many failed attempts. Try again in 28 minute(s).",
    "code": "ACCOUNT_LOCKED",
    "lockedUntil": "2026-02-18T12:05:00.000Z"
}
```

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/authController.js` | Added lockout logic in `login` handler |
| `backend/models/userModel.js` | Added `incrementFailedAttempts`, `lockAccount`, `resetFailedAttempts`, `isAccountLocked` |
| `backend/migration_sprint2.sql` | DB schema changes |
| `frontend/src/pages/Login.jsx` | Shows remaining attempts and lockout time |

## Security Impact

| Before | After |
|--------|-------|
| Unlimited login attempts | Max 5 attempts per 30 minutes |
| Brute force possible | Account locked after threshold |
| No feedback on attempts | Clear message with attempts remaining |

## UX Impact

- Users see how many attempts remain before lockout
- Clear lockout message with time remaining
- Lockout is lifted automatically (no admin action needed)
- Password reset bypasses lockout (legitimate recovery path)
