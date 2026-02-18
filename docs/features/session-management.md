# Feature: Session Management

**Type:** Security + UX  
**Priority:** High  
**Sprint:** 3  
**Status:** ✅ Implemented

---

## Overview

Tracks active user sessions in the database, allowing users to view all devices where they're logged in and remotely revoke any session. This is critical for responding to account compromise.

## How It Works

```
Session Creation:
1. User logs in → session record created in DB
2. Session token (48-byte random) stored with device info, IP, expiry

Session Validation:
1. Each authenticated request checks session is active and not expired
2. last_active timestamp updated on each request

Session Revocation:
1. User views active sessions → GET /auth/sessions
2. User clicks "Revoke" on suspicious session → DELETE /auth/sessions/:id
3. "Logout everywhere" → DELETE /auth/sessions (revokes all)

Cleanup:
1. Cron job runs daily to delete expired/revoked sessions
```

## Database Schema

```sql
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/sessions` | List all active sessions |
| DELETE | `/auth/sessions/:id` | Revoke a specific session |
| DELETE | `/auth/sessions` | Revoke all sessions (logout everywhere) |

## Files Changed

| File | Change |
|------|--------|
| `backend/models/sessionModel.js` | New - session CRUD operations |
| `backend/routes/securityRoutes.js` | Session management endpoints |
| `backend/migration_sprint2.sql` | `sessions` table creation |

## Security Impact

| Risk | Mitigation |
|------|------------|
| Stolen session token | User can revoke remotely |
| Persistent access after password change | `revokeAllSessions` called on password reset |
| Session fixation | New token generated on each login |
| Expired sessions | Auto-cleanup via cron job |

## UX Impact

- Users can see exactly where they're logged in (device, IP, last active)
- One-click revocation of suspicious sessions
- "Logout everywhere" for peace of mind after suspected compromise
- Sessions auto-expire after 7 days of inactivity
