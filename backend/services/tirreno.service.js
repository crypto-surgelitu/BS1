/**
 * Tirreno Security Analytics — Integration Service
 *
 * Sends user activity events to a self-hosted Tirreno instance for
 * risk-scoring, anomaly detection, and rule-based alerting.
 *
 * RULES:
 *  - Every outbound call is fire-and-forget (never awaited in the request path).
 *  - Every call is wrapped in try/catch — errors are logged, never thrown.
 *  - If env vars are missing the module silently no-ops.
 *  - Timeout on all HTTP calls: 2 000 ms.
 */

const axios = require('axios');
const qs = require('qs');

// ---------------------------------------------------------------------------
// Config — derived from .env
// ---------------------------------------------------------------------------
const SENSOR_URL = process.env.TIRRENO_SENSOR_URL || '';
const BASE_URL   = process.env.TIRRENO_BASE_URL   || '';
const API_KEY    = process.env.TIRRENO_API_KEY     || '';

const isEnabled = () => !!(SENSOR_URL && API_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the real client IP from the request.
 * Checks x-forwarded-for (first entry), x-real-ip, then socket.
 */
function getClientIp(req) {
    try {
        const xff = req.headers['x-forwarded-for'];
        if (xff) {
            const first = xff.split(',')[0].trim();
            if (first) return first;
        }
        if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
        if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
    } catch (_) { /* ignore */ }
    return '0.0.0.0';
}

/**
 * Format a Date as UTC "Y-m-d H:i:s.v" (PHP-style with milliseconds).
 * Example: "2024-06-06 14:20:01.283"
 */
function formatEventTime(date) {
    const d = date || new Date();
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
           `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.` +
           `${pad(d.getUTCMilliseconds(), 3)}`;
}

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

/**
 * Send a single event to the Tirreno sensor endpoint.
 * Fire-and-forget — callers should NOT await this.
 *
 * @param {Object} eventData  Key/value pairs matching Tirreno's sensor schema.
 */
function sendEvent(eventData) {
    if (!isEnabled()) return;

    try {
        axios.post(SENSOR_URL, qs.stringify(eventData), {
            headers: {
                'Api-Key': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 2000,
        }).catch(err => {
            console.warn('[Tirreno] Event send failed:', err.message);
        });
    } catch (err) {
        console.warn('[Tirreno] sendEvent error:', err.message);
    }
}

// ---------------------------------------------------------------------------
// Convenience trackers
// ---------------------------------------------------------------------------

/**
 * Build a base payload from an Express request + optional user object.
 * The user object may come from req.user (JWT-decoded, minimal fields)
 * or from a full DB row (has full_name, department, etc.).
 */
function _basePayload(req, user) {
    const payload = {
        ipAddress:       getClientIp(req),
        url:             req.originalUrl,
        userAgent:       req.headers['user-agent'] || '',
        httpReferer:     req.headers['referer'] || '',
        httpMethod:      req.method,
        browserLanguage: req.headers['accept-language'] || '',
        eventTime:       formatEventTime(new Date()),
    };

    if (user) {
        // userName — unique identifier; use email (most reliable across the codebase)
        payload.userName     = user.email || '';
        payload.emailAddress = user.email || '';

        // fullName — may be on user.full_name (DB) or user.fullName (response body)
        const fullName = user.full_name || user.fullName || '';
        if (fullName) payload.fullName = fullName;
    }

    return payload;
}

function trackLogin(req, user) {
    try {
        const payload = _basePayload(req, user);
        payload.eventType = 'account_login';
        payload.httpCode  = '200';
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackLogin error:', err.message);
    }
}

function trackLoginFail(req, emailOrIdentifier) {
    try {
        const payload = _basePayload(req, null);
        payload.eventType    = 'account_login_fail';
        payload.httpCode     = '401';
        payload.userName     = emailOrIdentifier || '';
        payload.emailAddress = emailOrIdentifier || '';
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackLoginFail error:', err.message);
    }
}

function trackRegistration(req, user) {
    try {
        const payload = _basePayload(req, user);
        payload.eventType   = 'account_registration';
        payload.httpCode    = '201';
        payload.userCreated = formatEventTime(new Date());
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackRegistration error:', err.message);
    }
}

function trackLogout(req, user) {
    try {
        const payload = _basePayload(req, user);
        payload.eventType = 'account_logout';
        payload.httpCode  = '200';
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackLogout error:', err.message);
    }
}

function trackBookingAction(req, user, actionLabel) {
    try {
        const payload = _basePayload(req, user);
        // Map action labels to Tirreno event types
        if (actionLabel && actionLabel.toLowerCase().includes('create')) {
            payload.eventType = 'page_edit';
        } else if (actionLabel && actionLabel.toLowerCase().includes('cancel')) {
            payload.eventType = 'page_delete';
        } else {
            payload.eventType = 'field_edit';
        }
        payload.httpCode = String(actionLabel && actionLabel.toLowerCase().includes('create') ? 201 : 200);
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackBookingAction error:', err.message);
    }
}

function trackPasswordChange(req, user) {
    try {
        const payload = _basePayload(req, user);
        payload.eventType = 'account_password_change';
        payload.httpCode  = '200';
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackPasswordChange error:', err.message);
    }
}

function trackAccountEdit(req, user) {
    try {
        const payload = _basePayload(req, user);
        payload.eventType = 'account_edit';
        payload.httpCode  = '200';
        sendEvent(payload);
    } catch (err) {
        console.warn('[Tirreno] trackAccountEdit error:', err.message);
    }
}

// ---------------------------------------------------------------------------
// Blacklist API
// ---------------------------------------------------------------------------

/**
 * Check whether a user identifier is blacklisted in Tirreno.
 * Returns true if blacklisted, false otherwise (including on any error — fail open).
 *
 * @param {string} userIdentifier  The userName value (email) to check.
 * @returns {Promise<boolean>}
 */
async function isBlacklisted(userIdentifier) {
    if (!BASE_URL || !API_KEY || !userIdentifier) return false;

    try {
        const response = await axios.post(
            `${BASE_URL}/api/v1/blacklist/search`,
            { value: userIdentifier },
            {
                headers: {
                    'Api-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout: 2000,
            }
        );
        return !!(response.data && response.data.blacklisted);
    } catch (err) {
        console.warn('[Tirreno] Blacklist check failed (fail-open):', err.message);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
    sendEvent,
    getClientIp,
    formatEventTime,
    trackLogin,
    trackLoginFail,
    trackRegistration,
    trackLogout,
    trackBookingAction,
    trackPasswordChange,
    trackAccountEdit,
    isBlacklisted,
};
