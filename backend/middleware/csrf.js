const crypto = require('crypto');

/**
 * CSRF Protection Middleware
 * 
 * Uses the Double Submit Cookie pattern:
 * 1. Server sets a CSRF token in a cookie (readable by JS)
 * 2. Client must send the same token in the X-CSRF-Token header
 * 3. Server validates they match using timing-safe comparison
 * 
 * This is the recommended approach for JWT-based stateless APIs.
 * Note: csurf is deprecated; this is a modern, secure replacement.
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32; // bytes

/**
 * Generate a cryptographically secure CSRF token
 */
const generateCsrfToken = () => {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
};

/**
 * Middleware: Set CSRF token cookie on every response
 * The cookie is NOT HttpOnly so the frontend JS can read it
 */
const setCsrfToken = (req, res, next) => {
    if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
        const token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,       // Must be readable by JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        req.csrfToken = token;
    } else {
        req.csrfToken = req.cookies[CSRF_COOKIE_NAME];
    }
    next();
};

/**
 * Middleware: Validate CSRF token on state-changing requests
 * Apply this to POST, PUT, DELETE routes
 */
const validateCsrf = (req, res, next) => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies && req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];

    if (!cookieToken || !headerToken) {
        return res.status(403).json({
            error: 'CSRF token missing. Please include X-CSRF-Token header.',
            code: 'CSRF_TOKEN_MISSING'
        });
    }

    // Tokens must be valid hex strings of correct length
    if (cookieToken.length !== TOKEN_LENGTH * 2 || headerToken.length !== TOKEN_LENGTH * 2) {
        return res.status(403).json({
            error: 'Invalid CSRF token format.',
            code: 'CSRF_TOKEN_INVALID'
        });
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
        if (!crypto.timingSafeEqual(
            Buffer.from(cookieToken, 'hex'),
            Buffer.from(headerToken, 'hex')
        )) {
            console.warn(`⚠️  CSRF validation failed for IP: ${req.ip} on ${req.path}`);
            return res.status(403).json({
                error: 'Invalid CSRF token.',
                code: 'CSRF_TOKEN_INVALID'
            });
        }
    } catch (err) {
        return res.status(403).json({
            error: 'Invalid CSRF token.',
            code: 'CSRF_TOKEN_INVALID'
        });
    }

    next();
};

/**
 * Endpoint handler: Return current CSRF token
 * Frontend calls GET /csrf-token before making state-changing requests
 */
const getCsrfToken = (req, res) => {
    const token = req.csrfToken || (req.cookies && req.cookies[CSRF_COOKIE_NAME]);
    if (!token) {
        const newToken = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, newToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        return res.json({ csrfToken: newToken });
    }
    res.json({ csrfToken: token });
};

module.exports = {
    setCsrfToken,
    validateCsrf,
    getCsrfToken,
    generateCsrfToken,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME
};
