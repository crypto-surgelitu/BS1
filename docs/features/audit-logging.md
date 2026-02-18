# Feature: Audit Logging

**Type:** Security + Compliance  
**Priority:** Medium  
**Sprint:** 3  
**Status:** ✅ Implemented

---

## Overview

Records all significant system actions (booking creation, status changes, admin operations) to a persistent `audit_logs` table. Provides a complete accountability trail for compliance, incident response, and detecting suspicious patterns.

## How It Works

```
1. Admin/user performs an action (e.g., approves a booking)
2. AuditLogger middleware hooks into the response
3. After a successful response (2xx), the action is logged:
   - Who did it (user_id, email)
   - What they did (action name)
   - What was affected (entity_type, entity_id)
   - When (timestamp)
   - From where (IP address, user agent)
4. Logs stored in audit_logs table
5. Admin can query logs via GET /admin/analytics
```

## Database Schema

```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Logged Actions

| Action | Trigger |
|--------|---------|
| `BOOKING_CREATED` | User creates a booking |
| `BOOKING_STATUS_UPDATED` | Admin approves/rejects booking |
| `ROOM_CREATED` | Admin adds a room |
| `ROOM_DELETED` | Admin deletes a room |

## Middleware Usage

```javascript
// Apply to any route to auto-log on success
router.post('/book',
    authenticate,
    AuditLogger.middleware('BOOKING_CREATED', 'booking'),
    bookingController.createBooking
);
```

## Files Changed

| File | Change |
|------|--------|
| `backend/middleware/auditLogger.js` | New - audit logging middleware |
| `backend/routes/bookingRoutes.js` | Applied audit logging to booking routes |
| `backend/migration_sprint2.sql` | `audit_logs` table creation |

## Security Impact

| Benefit | Description |
|---------|-------------|
| Accountability | Every admin action is traceable |
| Incident response | Can reconstruct what happened and when |
| Anomaly detection | Unusual patterns visible in logs |
| Non-repudiation | Users cannot deny actions they performed |

## Design Decisions

- **Non-blocking**: Audit log failures never break the main request flow
- **Post-response**: Logs only after successful operations (no false positives)
- **Minimal overhead**: Single async DB insert per logged action
- **Structured data**: JSON `details` field for flexible metadata
