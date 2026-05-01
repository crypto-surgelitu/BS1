/**
 * Tirreno Middleware
 *
 * tirrenoAutoTrack  — fires a page_view event on every authenticated request
 *                     via res.on('finish'). Zero latency added to the response.
 *
 * tirrenoBlacklistGate — async middleware that checks the Tirreno blacklist
 *                        before allowing high-risk actions. Returns 403 if
 *                        the user is blacklisted.
 */

const {
    sendEvent,
    getClientIp,
    formatEventTime,
    isBlacklisted,
} = require('../services/tirreno.service');

// ---------------------------------------------------------------------------
// Auto-track middleware (default export)
// ---------------------------------------------------------------------------

/**
 * Express middleware that hooks into res.on('finish') to send a page_view
 * event to Tirreno for every request where req.user is populated.
 *
 * Must be mounted AFTER route handlers so that req.user is set by auth
 * middleware inside the routes. Because it calls next() immediately, it
 * adds zero latency to the request/response cycle.
 */
function tirrenoAutoTrack(req, res, next) {
    // Call next() immediately — no blocking
    next();

    // Hook into response finish to capture final status code
    res.on('finish', () => {
        try {
            // Only track authenticated requests
            if (!req.user || !req.user.email) return;

            sendEvent({
                userName:        req.user.email,
                emailAddress:    req.user.email,
                ipAddress:       getClientIp(req),
                url:             req.originalUrl,
                userAgent:       req.headers['user-agent'] || '',
                httpReferer:     req.headers['referer'] || '',
                httpMethod:      req.method,
                httpCode:        String(res.statusCode),
                browserLanguage: req.headers['accept-language'] || '',
                eventType:       'page_view',
                eventTime:       formatEventTime(new Date()),
            });
        } catch (err) {
            // Never crash the app — swallow silently
            console.warn('[Tirreno] autoTrack error:', err.message);
        }
    });
}

// ---------------------------------------------------------------------------
// Blacklist gate middleware (named export)
// ---------------------------------------------------------------------------

/**
 * Async Express middleware that queries Tirreno's blacklist API.
 * If the current user is blacklisted, the request is rejected with 403.
 * If Tirreno is unreachable, or req.user is absent, the request proceeds
 * (fail-open behaviour).
 */
async function tirrenoBlacklistGate(req, res, next) {
    try {
        // If no authenticated user, let the auth middleware handle it
        if (!req.user || !req.user.email) {
            return next();
        }

        const blocked = await isBlacklisted(req.user.email);

        if (blocked) {
            return res.status(403).json({
                error: 'Your account has been flagged by our security system. Please contact support.',
                code: 'TIRRENO_BLACKLISTED',
            });
        }

        next();
    } catch (err) {
        // Fail open — if anything goes wrong, allow the request
        console.warn('[Tirreno] blacklistGate error (fail-open):', err.message);
        next();
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = tirrenoAutoTrack;
module.exports.tirrenoBlacklistGate = tirrenoBlacklistGate;
