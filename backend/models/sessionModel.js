const { dbPromise } = require('../config/db');
const crypto = require('crypto');

/**
 * Session Model
 * 
 * Manages user sessions in the database for enhanced security.
 * Allows users to view active sessions and revoke them remotely.
 * 
 * Security Impact: Prevents session hijacking and allows users to
 * immediately invalidate compromised sessions from any device.
 */
const SessionModel = {

    /**
     * Create a new session record
     */
    async create({ userId, deviceInfo, ipAddress, expiresAt }) {
        const sessionToken = crypto.randomBytes(48).toString('hex');
        const [result] = await dbPromise.query(
            `INSERT INTO sessions (user_id, session_token, device_info, ip_address, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, sessionToken, deviceInfo, ipAddress, expiresAt]
        );
        return { id: result.insertId, sessionToken };
    },

    /**
     * Find a session by token (only active, non-expired sessions)
     */
    async findByToken(token) {
        const [rows] = await dbPromise.query(
            `SELECT * FROM sessions 
             WHERE session_token = ? AND revoked = FALSE AND expires_at > NOW()`,
            [token]
        );
        return rows[0] || null;
    },

    /**
     * Get all active sessions for a user
     */
    async getActiveSessions(userId) {
        const [rows] = await dbPromise.query(
            `SELECT id, device_info, ip_address, last_active, created_at, expires_at
             FROM sessions
             WHERE user_id = ? AND revoked = FALSE AND expires_at > NOW()
             ORDER BY last_active DESC`,
            [userId]
        );
        return rows;
    },

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionId, userId) {
        const [result] = await dbPromise.query(
            'UPDATE sessions SET revoked = TRUE WHERE id = ? AND user_id = ?',
            [sessionId, userId]
        );
        return result.affectedRows > 0;
    },

    /**
     * Revoke all sessions for a user (e.g., on password change)
     */
    async revokeAllSessions(userId) {
        const [result] = await dbPromise.query(
            'UPDATE sessions SET revoked = TRUE WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows;
    },

    /**
     * Update last_active timestamp
     */
    async touch(sessionId) {
        await dbPromise.query(
            'UPDATE sessions SET last_active = NOW() WHERE id = ?',
            [sessionId]
        );
    },

    /**
     * Clean up expired sessions (called by cron job)
     */
    async cleanExpired() {
        const [result] = await dbPromise.query(
            'DELETE FROM sessions WHERE expires_at < NOW() OR revoked = TRUE'
        );
        return result.affectedRows;
    }
};

module.exports = SessionModel;
