# Admin Security Enhancement Plan

## Overview

This document outlines security enhancements for the admin panel. The goal is to implement **medium-strict** security measures that protect admin accounts without being overly burdensome.

---

## Current State

### Already Implemented
- ✅ JWT-based authentication
- ✅ Role-based authorization (`authorizeAdmin`, `authorizeSuperAdmin`)
- ✅ Separate admin login URL (`/admin/login`)
- ✅ Rate limiting (authLimiter, apiLimiter, adminLimiter)
- ✅ 2FA/TOTP support
- ✅ Audit logging
- ✅ Account lockout mechanism
- ✅ Session management

### Gaps Identified
- ❌ Admin login has same rate limit as regular login (50 attempts/15min)
- ❌ No reCAPTCHA protection for admin login
- ❌ Admin sessions use same duration as user sessions
- ❌ No mandatory 2FA for admin accounts
- ❌ No separate JWT token handling for admins
- ❌ Admin rate limiter is too lenient (100 requests/15min)

---

## Implementation Plan

### Phase 1: reCAPTCHA Protection for Admin Login

**Priority: HIGH**

Implement Google reCAPTCHA v2 Invisible for admin login to prevent automated bot attacks.

**Frontend:** `frontend/src/pages/AdminLogin.jsx`
```javascript
import ReCAPTCHA from 'react-google-recaptcha';

<ReCAPTCHA
  sitekey={process.env.VITE_RECAPTCHA_SITE_KEY}
  ref={captchaRef}
  theme="dark"
  size="invisible"
  badge="bottomright"
  onChange={handleCaptcha}
/>
```

**Backend Middleware:** `backend/middleware/verifyRecaptcha.js`
```javascript
const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
    const recaptchaToken = req.body.recaptchaToken;
    
    if (!recaptchaToken) {
        return res.status(400).json({ error: 'reCAPTCHA verification required' });
    }
    
    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            }
        );
        
        if (!response.data.success || response.data.score < 0.5) {
            return res.status(403).json({ error: 'reCAPTCHA verification failed' });
        }
        
        next();
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return res.status(500).json({ error: 'reCAPTCHA verification error' });
    }
};
```

**Backend Route:** `backend/routes/authRoutes.js`
```javascript
const verifyRecaptcha = require('../middleware/verifyRecaptcha');
router.post('/admin/login', adminAuthLimiter, verifyRecaptcha, authController.adminLogin);
```

**Environment Variables:**
```
# Backend (.env)
RECAPTCHA_SECRET_KEY=your_secret_key

# Frontend (.env)
VITE_RECAPTCHA_SITE_KEY=your_site_key
```

---

### Phase 2: Enhanced Rate Limiting for Admin Login

**Priority: HIGH**

Create a dedicated stricter rate limiter for admin authentication endpoints.

**File:** `backend/middleware/rateLimiter.js`

```javascript
// Add this limiter
const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // Only 5 attempts (stricter)
    message: {
        error: 'Too many admin login attempts. Please try again after 15 minutes.',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,  // Only count failed attempts
    handler: (req, res) => {
        console.warn(`⚠️  Admin rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many admin login attempts. Please try again after 15 minutes.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
        });
    }
});
```

**Apply to:** `/admin/login` route and related admin auth endpoints

---

### Phase 3: Stricter Admin API Rate Limiting

**Priority: HIGH**

Reduce the admin API rate limit to be more restrictive.

**File:** `backend/middleware/rateLimiter.js`

```javascript
const adminApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 30,                   // 30 requests per 15 min (was 100)
    message: {
        error: 'Too many admin API requests. Please try again later.',
        code: 'ADMIN_API_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});
```

---

### Phase 4: Shorter Admin Session Duration

**Priority: MEDIUM**

Implement shorter JWT expiration for admin users.

**File:** `backend/utils/tokenUtils.js`

Add a function to generate admin-specific tokens with shorter expiration:

```javascript
function generateAdminToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role, tokenType: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }  // 2 hours for admin (vs 24h for users)
    );
}
```

**Or** modify existing token generation to check role and adjust expiry accordingly.

---

### Phase 5: Mandatory 2FA for Admin Accounts

**Priority: MEDIUM**

Make 2FA mandatory for admin and super_admin roles.

**Option A: Soft Enforcement** (Recommended for medium)
- Prompt admins to enable 2FA on first login
- Show warning banner if 2FA is not enabled
- Allow temporary access (7 days) before forcing 2FA

**Option B: Hard Enforcement** (Strict)
- Block admin login if 2FA is not enabled
- Require 2FA setup before accessing admin dashboard

**Implementation approach:**
- Add `require2fa` field to user model for admin roles
- Modify login flow to check role and enforce 2FA
- Create admin-specific 2FA setup prompt

**Database migration:**
```sql
ALTER TABLE users ADD COLUMN require_2fa BOOLEAN DEFAULT FALSE;
UPDATE users SET require_2fa = TRUE WHERE role IN ('admin', 'super_admin');
```

---

### Phase 6: Admin Login Audit & Alerting

**Priority: MEDIUM**

Enhanced logging for admin login attempts.

**File:** `backend/middleware/auditLogger.js`

Add admin-specific audit events:
- `ADMIN_LOGIN_SUCCESS`
- `ADMIN_LOGIN_FAILED`
- `ADMIN_LOGIN_2FA_REQUIRED`
- `ADMIN_PASSWORD_CHANGED`
- `ADMIN_SESSION_EXPIRED`

**Implementation:**
- Log IP address, user agent, location (if possible)
- Alert super admin on failed admin login attempts (3+ failed)
- Store admin login history for 90 days

---

### Phase 7: IP-Based Admin Access Control (Optional)

**Priority: LOW**

Allow restricting admin access to specific IPs.

**Database:**
```sql
CREATE TABLE admin_allowed_ips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Note:** This is optional and may not be suitable if admins need to access from various locations.

---

## Summary

| Feature | Priority | Strictness |
|---------|----------|------------|
| reCAPTCHA for Admin Login | HIGH | Medium |
| Admin Login Rate Limit (5 attempts/15min) | HIGH | Medium-Strict |
| Admin API Rate Limit (30 requests/15min) | HIGH | Medium |
| Shorter Admin Session (2 hours) | MEDIUM | Medium |
| Mandatory 2FA for Admins | MEDIUM | Medium |
| Enhanced Admin Audit Logging | MEDIUM | Medium |
| IP-Based Admin Access | LOW | Strict |

---

## Recommended Implementation Order

1. **Phase 1** - reCAPTCHA for Admin Login
2. **Phase 2** - Admin Login Rate Limiting
3. **Phase 3** - Admin API Rate Limiting
4. **Phase 6** - Admin Audit Logging (immediate visibility)
5. **Phase 4** - Shorter Admin Sessions
6. **Phase 5** - Mandatory 2FA (may require user onboarding)
7. **Phase 7** - IP-Based Access (optional)

---

## Backward Compatibility

- All changes should be backward compatible
- Existing admin accounts should be able to log in during migration
- 2FA enforcement should have a grace period
- Rate limit increases should not lock out existing admins

---

## Files to Modify

1. `frontend/src/pages/AdminLogin.jsx` - Add reCAPTCHA component
2. `backend/middleware/verifyRecaptcha.js` - Create reCAPTCHA verification middleware
3. `backend/middleware/rateLimiter.js` - Add admin rate limiters
4. `backend/utils/tokenUtils.js` - Add admin token generation
5. `backend/routes/authRoutes.js` - Apply rate limiter and reCAPTCHA to admin login
6. `backend/routes/superAdminRoutes.js` - Apply API rate limiter
7. `backend/controllers/authController.js` - 2FA enforcement logic
8. `backend/middleware/auditLogger.js` - Admin-specific audit events
9. Database migration for `require_2fa` field
