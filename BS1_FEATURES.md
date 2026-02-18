# BS1 — SwahiliPot Hub Room Booking System
## Complete Feature Reference

**Version:** 2.0 (Sprint 2–4)  
**Date:** February 18, 2026  
**Status:** Production-Ready Security + Core UX Features

---

## System Overview

BS1 is the SwahiliPot Hub Room Booking System — a full-stack web application that streamlines the process of discovering, booking, and managing meeting rooms and event spaces at SwahiliPot Hub, Mombasa.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express.js |
| Database | MySQL (via mysql2) |
| Authentication | JWT (Access + Refresh tokens) |
| Email | Nodemailer (Gmail SMTP / Ethereal) |
| Security | Helmet, CSRF, bcrypt, express-validator |
| 2FA | speakeasy (TOTP) + qrcode |

### System Goals

1. **Simplify room booking** — Users can browse available rooms and book in under 2 minutes
2. **Reduce conflicts** — Real-time availability and admin approval prevent double-bookings
3. **Secure by design** — Multi-layered security from authentication to audit trails
4. **Transparent operations** — Admins have full visibility via analytics and audit logs

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Guest** | View rooms, sign up, log in |
| **User** | Book rooms, view own bookings, manage profile, enable 2FA |
| **Admin** | All user capabilities + approve/reject bookings, manage rooms, view analytics, view audit logs |

---

# Part 1: Security Features

## 1.1 JWT Authentication ✅ Sprint 1

**Type:** Security — Critical  
**Doc:** Already documented in `PHASE1_SPRINT1_IMPLEMENTATION.md`

The foundation of BS1's security. All protected routes require a valid JWT access token in the `Authorization: Bearer <token>` header.

- **Access tokens**: 24-hour expiry, signed with `JWT_SECRET`
- **Refresh tokens**: 7-day expiry, signed with `JWT_REFRESH_SECRET`
- **Auto-refresh**: Frontend automatically refreshes expired tokens
- **Role claims**: Token payload includes `role` for authorization

**Endpoints:** `POST /login`, `POST /signup`, `POST /refresh-token`, `GET /me`

---

## 1.2 CSRF Protection ✅ Sprint 2

**Type:** Security — Critical  
**Doc:** [csrf-protection.md](docs/features/csrf-protection.md)

Protects against Cross-Site Request Forgery attacks using the **Double Submit Cookie** pattern — the OWASP-recommended approach for stateless JWT APIs.

**How it works:**
1. Server sets a `csrf_token` cookie (JS-readable)
2. Frontend reads cookie and sends it as `X-CSRF-Token` header
3. Server validates using timing-safe comparison

**Endpoint:** `GET /api/csrf-token`

> **Security Impact:** Prevents malicious sites from forging requests on behalf of logged-in users.

---

## 1.3 Email Verification ✅ Sprint 2

**Type:** Security + UX — High  
**Doc:** [email-verification.md](docs/features/email-verification.md)

Verifies users own their email address before granting full account access.

**Flow:** Signup → Verification email sent → User clicks link → Account activated

**Endpoints:** `POST /auth/verify-email`, `POST /auth/resend-verification`  
**Frontend:** `/verify-email?token=<token>`

**Database:** `email_verified`, `verification_token`, `verification_expires` columns on `users`

> **Security Impact:** Prevents fake accounts and ensures email communications reach real users.

---

## 1.4 Password Reset Flow ✅ Sprint 2

**Type:** Security + UX — High  
**Doc:** [password-reset.md](docs/features/password-reset.md)

Secure "forgot password" flow using time-limited (1 hour) email tokens. Prevents email enumeration by always returning the same response.

**Flow:** Forgot password → Email sent → Click link → Enter new password → Confirmed

**Endpoints:** `POST /auth/forgot-password`, `POST /auth/reset-password`  
**Frontend:** `/forgot-password`, `/reset-password?token=<token>`

**Database:** `password_reset_token`, `password_reset_expires` columns on `users`

> **Security Impact:** Secure account recovery without exposing whether an email is registered.

---

## 1.5 Account Lockout ✅ Sprint 2

**Type:** Security — High  
**Doc:** [account-lockout.md](docs/features/account-lockout.md)

Locks accounts for 30 minutes after 5 consecutive failed login attempts. Prevents brute-force password attacks.

| Parameter | Value |
|-----------|-------|
| Max attempts | 5 |
| Lockout duration | 30 minutes |
| Reset on success | Yes |
| Reset on password change | Yes |

**Database:** `failed_login_attempts`, `locked_until` columns on `users`

> **Security Impact:** Makes brute-force attacks computationally infeasible.

---

## 1.6 Two-Factor Authentication (2FA) ✅ Sprint 3

**Type:** Security — High  
**Doc:** [two-factor-auth.md](docs/features/two-factor-auth.md)

Optional TOTP-based 2FA using the RFC 6238 standard. Works with Google Authenticator, Authy, Microsoft Authenticator, and any TOTP-compatible app.

**Setup Flow:** Request QR code → Scan with app → Verify 6-digit code → 2FA enabled

**Endpoints:** `POST /auth/2fa/setup`, `POST /auth/2fa/enable`, `POST /auth/2fa/disable`, `POST /auth/2fa/verify`

**Database:** `totp_secret`, `totp_enabled` columns on `users`

> **Security Impact:** Even if a password is compromised, the account remains secure without the second factor.

---

## 1.7 Session Management ✅ Sprint 3

**Type:** Security + UX — High  
**Doc:** [session-management.md](docs/features/session-management.md)

Tracks active sessions in the database. Users can view all devices where they're logged in and remotely revoke any session.

**Endpoints:** `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions`

**Database:** `sessions` table (session_token, device_info, ip_address, last_active, expires_at, revoked)

> **Security Impact:** Users can immediately respond to account compromise by revoking all sessions.

---

## 1.8 Audit Logging ✅ Sprint 3

**Type:** Security + Compliance — Medium  
**Doc:** [audit-logging.md](docs/features/audit-logging.md)

Records all significant system actions to the `audit_logs` table for accountability and incident response.

**Logged Actions:** `BOOKING_CREATED`, `BOOKING_STATUS_UPDATED`, `ROOM_CREATED`, `ROOM_DELETED`

**Database:** `audit_logs` table (user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)

> **Security Impact:** Complete audit trail for compliance, incident response, and anomaly detection.

---

## 1.9 Enhanced Rate Limiting ✅ Sprint 1 + 3

**Type:** Security — Medium

Multi-tier rate limiting protecting all endpoints from abuse:

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|-----------|
| `authLimiter` | 5 requests | 15 min | Login, Signup, Password Reset |
| `apiLimiter` | 100 requests | 15 min | All API endpoints |
| `bookingLimiter` | 10 requests | 1 hour | Booking creation |
| `adminLimiter` | 50 requests | 15 min | Admin operations |

> **Security Impact:** Prevents DDoS, brute force, and spam booking attacks.

---

## 1.10 Security Headers ✅ Sprint 1 + 4

**Type:** Security — Medium  
**Doc:** [security-headers.md](docs/features/security-headers.md)

Enhanced HTTP security headers via `helmet` with a detailed Content Security Policy:

| Header | Protection |
|--------|-----------|
| `Content-Security-Policy` | Prevents XSS and data injection |
| `X-Frame-Options: DENY` | Prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Prevents MIME sniffing |
| `Strict-Transport-Security` | Forces HTTPS (1 year) |
| `Referrer-Policy: no-referrer` | Prevents referrer leakage |

---

## 1.11 Input Validation & Sanitization ✅ Sprint 1 + 4

**Type:** Security — Critical

Comprehensive input validation on all endpoints:

- **express-validator**: Type checking, format validation, length limits
- **express-mongo-sanitize**: Removes injection attack characters
- **Custom sanitization**: Strips XSS vectors (script tags, `javascript:`, event handlers)
- **Content-Type validation**: Only `application/json` accepted
- **Request size limits**: 100KB default, endpoint-specific overrides

---

# Part 2: UX Features

## 2.1 Room Booking System ✅ Sprint 1

The core feature. Users can:
- Browse all available rooms with capacity and amenities
- Check availability by date and time
- Submit a booking request (pending admin approval)
- View their booking history and status

**Endpoints:** `POST /book`, `GET /bookings/user/:userId`

---

## 2.2 Admin Booking Management ✅ Sprint 1

Admins can:
- View all bookings across all users
- Approve or reject pending bookings
- See booking details including user info and room

**Endpoints:** `GET /admin/bookings`, `PUT /bookings/:id/status`

---

## 2.3 Room Management ✅ Sprint 1

Admins can add and remove rooms with:
- Name and location (floor/space)
- Capacity
- Amenities (JSON array)
- Status (Available, Reserved, Booked, Maintenance)

**Endpoints:** `GET /rooms`, `GET /rooms/:id`, `POST /rooms`, `DELETE /rooms/:id`

---

## 2.4 Booking Categories ✅ Sprint 4

**Doc:** [booking-categories-notes.md](docs/features/booking-categories-notes.md)

Users classify their booking purpose:

| Category | Use Case |
|----------|----------|
| `meeting` | Team meetings, 1:1s (default) |
| `event` | Workshops, presentations |
| `training` | Courses, bootcamps |
| `co-working` | Work sessions |
| `other` | Any other purpose |

> **UX Impact:** Helps admins understand room usage patterns and feeds into analytics.

---

## 2.5 Booking Notes ✅ Sprint 4

**Doc:** [booking-categories-notes.md](docs/features/booking-categories-notes.md)

Free-text field (max 500 characters) for additional booking context — equipment needs, attendee count, special requirements.

> **UX Impact:** Reduces back-and-forth communication between users and admins.

---

## 2.6 Admin Analytics Dashboard ✅ Sprint 4

**Doc:** [admin-analytics.md](docs/features/admin-analytics.md)

Comprehensive booking analytics for data-driven decisions:

- **Summary totals**: Bookings, users, rooms by status
- **Popular rooms**: Top 10 by booking count
- **Booking trend**: Daily counts for last 30 days
- **Peak hours**: Busiest times of day
- **Category breakdown**: How rooms are being used
- **Monthly trend**: 6-month growth chart
- **User activity**: Top 20 most active users

**Endpoints:** `GET /admin/analytics`, `GET /admin/analytics/users`

> **UX Impact:** Enables admins to optimize room scheduling and identify capacity issues.

---

## 2.7 Email Notifications ✅ Sprint 1 + 2

Automated emails sent for key events:

| Event | Recipient | Content |
|-------|-----------|---------|
| Signup | User | Welcome + email verification link |
| Email verification | User | Verification link |
| Password reset | User | Reset link (1-hour expiry) |
| Password changed | User | Security confirmation |

Uses Nodemailer with Gmail SMTP (or Ethereal for testing).

---

## 2.8 Booking Reminders ✅ Sprint 1

Automated reminder emails sent via cron job before upcoming bookings. Configured in `backend/cron/reminderCron.js`.

---

## 2.9 Password Strength Enforcement ✅ Sprint 1

Strong password requirements enforced on both frontend and backend:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (`@$!%*?&`)

The Reset Password page shows live strength indicators as the user types.

---

# Part 3: Database Schema

## Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with auth, verification, lockout, 2FA fields |
| `rooms` | Room definitions with capacity and amenities |
| `bookings` | Booking records with status, category, notes |
| `sessions` | Active user sessions for session management |
| `audit_logs` | System action audit trail |
| `waitlist` | Waitlist entries for fully-booked time slots |

## Migration Files

| File | Purpose |
|------|---------|
| `backend/schema.sql` | Initial schema (Sprint 1) |
| `backend/migration_sprint2.sql` | Sprint 2–4 additions |

---

# Part 4: API Reference

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | None | Register new user |
| POST | `/login` | None | Login |
| POST | `/refresh-token` | None | Refresh access token |
| GET | `/me` | Required | Get current user |
| POST | `/auth/verify-email` | None | Verify email |
| POST | `/auth/resend-verification` | None | Resend verification |
| POST | `/auth/forgot-password` | None | Request password reset |
| POST | `/auth/reset-password` | None | Reset password |

## Security

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/csrf-token` | None | Get CSRF token |
| POST | `/auth/2fa/setup` | Required | Setup 2FA |
| POST | `/auth/2fa/enable` | Required | Enable 2FA |
| POST | `/auth/2fa/disable` | Required | Disable 2FA |
| POST | `/auth/2fa/verify` | None | Verify 2FA code |
| GET | `/auth/sessions` | Required | List sessions |
| DELETE | `/auth/sessions/:id` | Required | Revoke session |
| DELETE | `/auth/sessions` | Required | Revoke all sessions |

## Rooms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rooms` | None | List all rooms |
| GET | `/rooms/:id` | None | Get room details |
| POST | `/rooms` | Admin | Create room |
| DELETE | `/rooms/:id` | Admin | Delete room |

## Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/book` | Required | Create booking |
| GET | `/bookings/user/:userId` | Required | Get user bookings |
| PUT | `/bookings/:id/status` | Admin | Update booking status |
| GET | `/admin/bookings` | Admin | Get all bookings |
| GET | `/admin/analytics` | Admin | Analytics dashboard |
| GET | `/admin/analytics/users` | Admin | User activity stats |

---

# Part 5: Security Architecture

```
Request Flow:
Browser → CORS → Helmet (Headers) → Cookie Parser → Body Parser
       → Sanitization → CSRF Validation → Rate Limiting
       → JWT Authentication → Role Authorization → Controller
       → Audit Logger → Response
```

## Defense in Depth

| Layer | Protection |
|-------|-----------|
| Network | CORS whitelist, rate limiting |
| Transport | HTTPS (HSTS), secure cookies |
| Application | CSRF tokens, input validation, sanitization |
| Authentication | JWT + bcrypt + account lockout + 2FA |
| Authorization | Role-based access control |
| Data | Parameterized queries (SQL injection prevention) |
| Monitoring | Audit logs, health check endpoint |

---

# Part 6: Environment Variables

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=swahilipot_booking

# JWT
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
JWT_EXPIRES_IN=24h

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
NODE_ENV=development

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@swahilipothub.co.ke
```

---

# Part 7: How BS1 Improves Booking Operations at SwahiliPot

## Before BS1
- Manual booking via WhatsApp/email
- No visibility into room availability
- Double-bookings common
- No accountability for admin decisions
- No usage data for planning

## After BS1

| Problem | Solution |
|---------|---------|
| Double-bookings | Unique constraint on room+date+time, admin approval flow |
| No visibility | Real-time room status, user dashboard |
| No accountability | Audit logs for all admin actions |
| No planning data | Analytics dashboard with trends and peak hours |
| Security risks | 9 security layers from CSRF to 2FA |
| Account compromise | Session management, account lockout, 2FA |
| Fake accounts | Email verification required |
| Forgotten passwords | Secure password reset flow |

## Expected Impact

| Metric | Target |
|--------|--------|
| Booking conflicts | -50% |
| No-shows | -30% (via reminders) |
| Admin time on bookings | -40% (via analytics) |
| Security incidents | 0 successful attacks |
| Page load time | < 3 seconds |

---

*BS1 — Built for SwahiliPot Hub, Mombasa*  
*Last Updated: February 18, 2026*
