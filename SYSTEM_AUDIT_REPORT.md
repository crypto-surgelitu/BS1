# System Audit Report

Date: 2026-04-07

## Verification Summary

- Backend server starts on `http://localhost:3000`.
- Frontend production build passed with `cmd /c npm run build`.
- Frontend dev server responded with HTTP `200` on `http://localhost:5173`.
- Live database verification is still blocked because MySQL was not running locally during this audit.

## Fixed Issues

### 1. Cancel booking looked broken in the dashboard

- Issue:
  After a successful cancellation request, the dashboard did not refresh the user's booking list. The modal closed, but the booking card stayed visible as active until a manual reload.
- Impact:
  Users could assume the cancellation failed even when the backend accepted it.
- Solution:
  Updated [Dashboard.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/Dashboard.jsx) to:
  - update the cancelled booking locally
  - reset modal state cleanly
  - refresh dashboard data after success
- Status: Fixed

### 2. Cookie-based security flows were misconfigured locally

- Issue:
  The frontend was calling `http://127.0.0.1:3000` while the backend/frontend config mostly assumed `localhost`, and the API client was not sending `credentials: 'include'`.
- Impact:
  Cookie-backed features such as CSRF become unreliable or fail entirely across local environments.
- Solution:
  Updated:
  - [api.js](/C:/Users/ANTONY/Documents/BS1/frontend/src/services/api.js)
  - [frontend/.env](/C:/Users/ANTONY/Documents/BS1/frontend/.env)
  - [backend/.env](/C:/Users/ANTONY/Documents/BS1/backend/.env)
  - [backend/.env.example](/C:/Users/ANTONY/Documents/BS1/backend/.env.example)
- Status: Fixed

### 3. CSRF protection existed but was not actually enforced end to end

- Issue:
  The project had CSRF middleware and documentation, but no exposed token route and no validation layer in the request pipeline.
- Impact:
  State-changing requests were missing the intended CSRF protection.
- Solution:
  Updated:
  - [server.js](/C:/Users/ANTONY/Documents/BS1/backend/server.js)
  - [api.js](/C:/Users/ANTONY/Documents/BS1/frontend/src/services/api.js)
  to expose `/csrf-token`, fetch the token automatically, include credentials, and enforce validation on mutating routes.
- Status: Fixed

### 4. Admin login captcha was not enforced server-side

- Issue:
  The admin portal required captcha in the UI, but the backend route accepted admin login without verifying it.
- Impact:
  An attacker could bypass the captcha by calling the API directly.
- Solution:
  Updated:
  - [authRoutes.js](/C:/Users/ANTONY/Documents/BS1/backend/routes/authRoutes.js)
  - [verifyRecaptcha.js](/C:/Users/ANTONY/Documents/BS1/backend/middleware/verifyRecaptcha.js)
  - [authController.js](/C:/Users/ANTONY/Documents/BS1/backend/controllers/authController.js)
  - [AdminLogin.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/AdminLogin.jsx)
  - [ForgotPassword.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/ForgotPassword.jsx)
- Status: Fixed

### 5. reCAPTCHA secrets and site keys were hardcoded in source

- Issue:
  The backend secret and frontend site key were embedded directly in application code.
- Impact:
  Sensitive/security configuration drifted into source instead of environment configuration.
- Solution:
  Moved the runtime config to env-backed values in:
  - [backend/.env](/C:/Users/ANTONY/Documents/BS1/backend/.env)
  - [backend/.env.example](/C:/Users/ANTONY/Documents/BS1/backend/.env.example)
  - [frontend/.env](/C:/Users/ANTONY/Documents/BS1/frontend/.env)
  - [AdminLogin.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/AdminLogin.jsx)
  - [ForgotPassword.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/ForgotPassword.jsx)
- Status: Fixed

### 6. Booking schema did not match the codebase

- Issue:
  The application code used:
  - booking status `rejected`
  - booking `notes`
  - booking `category`
  - `required_amenities`
  - `preferred_amenities`
  but the main schema/repair flow did not consistently create those fields.
- Impact:
  Fresh or repaired databases could fail at runtime during booking creation or admin review actions.
- Solution:
  Updated:
  - [schema.sql](/C:/Users/ANTONY/Documents/BS1/backend/schema.sql)
  - [repair-database.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/repair-database.js)
  - [apply-system-fixes.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/apply-system-fixes.js)
- Status: Fixed in code and migration tooling

### 7. Queue/waitlist behavior was blocked by a unique booking index

- Issue:
  The booking logic supports queueing overlapping requests, but the database schema had a unique constraint on `room_id + booking_date + start_time + end_time`.
- Impact:
  Only one record could exist per slot, so queue/waitlist behavior could not work as designed.
- Solution:
  Replaced the blocking unique index with a non-unique lookup index in:
  - [schema.sql](/C:/Users/ANTONY/Documents/BS1/backend/schema.sql)
  - [repair-database.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/repair-database.js)
  - [apply-system-fixes.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/apply-system-fixes.js)
- Status: Fixed in code and migration tooling

### 8. Admin and superadmin defaults were inconsistent and drifting

- Issue:
  The default admin and superadmin credentials were spread across schema, scripts, placeholders, and env files, and some repair paths reused the wrong hash.
- Impact:
  Account clashes and unpredictable login behavior were likely during setup or recovery.
- Solution:
  Standardized the defaults to:
  - Admin: `admin@swahilipot.co.ke` / `admin@123`
  - Superadmin: `superadmin@bs1.com` / `superadmin@123`

  Updated:
  - [systemAccounts.js](/C:/Users/ANTONY/Documents/BS1/backend/config/systemAccounts.js)
  - [schema.sql](/C:/Users/ANTONY/Documents/BS1/backend/schema.sql)
  - [repair-database.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/repair-database.js)
  - [apply-system-fixes.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/apply-system-fixes.js)
  - [fix_admin.js](/C:/Users/ANTONY/Documents/BS1/backend/fix_admin.js)
  - [backend/.env](/C:/Users/ANTONY/Documents/BS1/backend/.env)
  - [backend/.env.example](/C:/Users/ANTONY/Documents/BS1/backend/.env.example)
  - [README.md](/C:/Users/ANTONY/Documents/BS1/README.md)
- Status: Fixed in config, schema, and repair tooling

### 9. Admin portal could crash on extra-verification responses

- Issue:
  If admin login returned 2FA or password-reset OTP requirements, the admin portal still assumed a normal `data.user` payload.
- Impact:
  The admin login UI could fail on verified security flows.
- Solution:
  Updated:
  - [authService.js](/C:/Users/ANTONY/Documents/BS1/frontend/src/services/authService.js)
  - [AdminLogin.jsx](/C:/Users/ANTONY/Documents/BS1/frontend/src/pages/AdminLogin.jsx)
- Status: Fixed

## Remaining Blocker

### Live database was unavailable during the audit

- Issue:
  MySQL connection attempts returned `ECONNREFUSED`, and backend health could not report a connected database.
- Impact:
  I could not execute the DB sync script against the live database from this session, so the stored admin/superadmin rows and booking table still need the migration applied once MySQL is running.
- Prepared solution:
  Run this after MySQL is up:

```bash
cd backend
npm run apply-fixes
```

- Related files:
  - [apply-system-fixes.js](/C:/Users/ANTONY/Documents/BS1/backend/scripts/apply-system-fixes.js)
  - [backend/package.json](/C:/Users/ANTONY/Documents/BS1/backend/package.json)

## Notes

- Default credentials are now intentionally defined for setup consistency, but they should still be rotated after first successful login in any non-local environment.
- The backend now returns clearer `503` responses for login/signup when the database is unavailable.
