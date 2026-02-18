# Feature: Two-Factor Authentication (2FA)

**Type:** Security  
**Priority:** High  
**Sprint:** 3  
**Status:** ✅ Implemented

---

## Overview

Optional TOTP (Time-based One-Time Password) two-factor authentication using the industry-standard RFC 6238 algorithm. Users can enable 2FA via any authenticator app (Google Authenticator, Authy, Microsoft Authenticator).

## How It Works

```
Setup:
1. User requests 2FA setup → server generates TOTP secret
2. Secret stored in DB (not yet enabled)
3. QR code returned as base64 data URL
4. User scans QR code with authenticator app
5. User submits 6-digit code to verify → 2FA enabled

Login with 2FA:
1. User logs in with email/password (standard flow)
2. If totp_enabled = TRUE → frontend prompts for 6-digit code
3. User enters code from authenticator app
4. POST /auth/2fa/verify validates the code
5. Access granted if code is valid
```

## Database Changes

```sql
ALTER TABLE users
    ADD COLUMN totp_secret VARCHAR(255) DEFAULT NULL,
    ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/2fa/setup` | Required | Generate secret + QR code |
| POST | `/auth/2fa/enable` | Required | Enable 2FA after verifying code |
| POST | `/auth/2fa/disable` | Required | Disable 2FA (requires current code) |
| POST | `/auth/2fa/verify` | None | Verify code during login |

## Dependencies

```bash
npm install speakeasy qrcode
```

| Package | Purpose |
|---------|---------|
| `speakeasy` | TOTP secret generation and code verification |
| `qrcode` | QR code generation as base64 data URL |

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/twoFactorController.js` | New - 2FA setup, enable, disable, verify |
| `backend/routes/securityRoutes.js` | New - 2FA and session routes |
| `backend/models/userModel.js` | Added `setTotpSecret`, `enableTotp`, `disableTotp` |
| `backend/server.js` | Mounted security routes |

## Security Impact

| Risk | Mitigation |
|------|------------|
| Password compromise | 2FA adds second factor |
| TOTP replay attacks | 30-second window with 1-step drift tolerance |
| Secret theft | Secret stored server-side, never sent to client after setup |
| Disable without auth | Requires current TOTP code to disable |

## UX Impact

- Completely optional — users choose to enable it
- Works with any TOTP authenticator app
- QR code makes setup easy (no manual key entry needed)
- Manual key provided as fallback
- Clear enable/disable flow with confirmation
