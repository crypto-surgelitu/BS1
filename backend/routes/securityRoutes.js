const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const SessionModel = require('../models/sessionModel');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// ============================================================
// TWO-FACTOR AUTHENTICATION ROUTES (all require authentication)
// ============================================================

// POST /auth/2fa/setup - Generate TOTP secret and QR code
router.post('/auth/2fa/setup', authenticate, twoFactorController.setup);

// POST /auth/2fa/enable - Enable 2FA after verifying code
router.post('/auth/2fa/enable',
    authenticate,
    [body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit code required')],
    handleValidationErrors,
    twoFactorController.enable
);

// POST /auth/2fa/disable - Disable 2FA
router.post('/auth/2fa/disable',
    authenticate,
    [body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit code required')],
    handleValidationErrors,
    twoFactorController.disable
);

// POST /auth/2fa/verify - Verify TOTP code (during login or session verification)
router.post('/auth/2fa/verify',
    [
        body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit code required'),
        body('userId').optional().isInt(),
        body('tempToken').optional().isString()
    ],
    handleValidationErrors,
    twoFactorController.verify
);

// ============================================================
// SESSION MANAGEMENT ROUTES
// ============================================================

// GET /auth/sessions - Get all active sessions for current user
router.get('/auth/sessions', authenticate, async (req, res) => {
    try {
        const sessions = await SessionModel.getActiveSessions(req.user.id);
        res.json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// DELETE /auth/sessions/:id - Revoke a specific session
router.delete('/auth/sessions/:id', authenticate, async (req, res) => {
    try {
        const revoked = await SessionModel.revokeSession(parseInt(req.params.id), req.user.id);
        if (!revoked) {
            return res.status(404).json({ error: 'Session not found or already revoked' });
        }
        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
});

// DELETE /auth/sessions - Revoke all sessions (logout everywhere)
router.delete('/auth/sessions', authenticate, async (req, res) => {
    try {
        const count = await SessionModel.revokeAllSessions(req.user.id);
        res.json({ message: `Logged out from ${count} session(s) successfully` });
    } catch (error) {
        console.error('Revoke all sessions error:', error);
        res.status(500).json({ error: 'Failed to revoke sessions' });
    }
});

module.exports = router;
