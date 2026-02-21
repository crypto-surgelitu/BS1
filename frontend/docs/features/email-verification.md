# Feature: Email Verification

**Type:** Security + UX  
**Priority:** High  
**Sprint:** 2  
**Status:** ✅ Implemented

---

## Overview

Email verification ensures that users own the email address they register with. Unverified accounts are created but flagged, and a verification link is sent immediately after signup.

## How It Works

```
1. User signs up → account created with email_verified = FALSE
2. Server generates a 32-byte random token (64-char hex)
3. Token stored in DB with 24-hour expiry
4. Verification email sent with link: /verify-email?token=<token>
5. User clicks link → frontend sends token to POST /auth/verify-email
6. Server validates token (not expired, exists in DB)
7. email_verified set to TRUE, token cleared
```

## Database Changes

```sql
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN verification_token VARCHAR(128) DEFAULT NULL,
    ADD COLUMN verification_expires DATETIME DEFAULT NULL;
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/resend-verification` | Resend verification email |

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/authController.js` | Added `verifyEmail`, `resendVerification` handlers |
| `backend/routes/authRoutes.js` | Added verification routes |
| `backend/models/userModel.js` | Added `setVerificationToken`, `findByVerificationToken`, `markEmailVerified` |
| `backend/migration_sprint2.sql` | DB schema changes |
| `frontend/src/pages/VerifyEmail.jsx` | New verification page |

## Email Template

The verification email includes:
- Personalized greeting with user's full name
- Branded HTML email with SwahiliPot Hub styling
- Clear CTA button linking to the verification page
- 24-hour expiry notice

## Security Impact

| Risk | Mitigation |
|------|------------|
| Fake email registration | Email must be verified before full access |
| Token brute force | 32-byte random token (2^256 combinations) |
| Token reuse | Token cleared after successful verification |
| Expired tokens | 24-hour expiry enforced at DB level |

## UX Impact

- Users receive a branded welcome email immediately after signup
- Clear instructions on the verification page
- "Resend verification" option if email is lost
- Graceful error handling for expired/invalid tokens
