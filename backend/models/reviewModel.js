const { dbPromise } = require('../config/db');

const ReviewModel = {
    async create(userId, bookingId, rating, comment, systemFeedback) {
        const [result] = await dbPromise.query(
            'INSERT INTO reviews (user_id, booking_id, rating, comment, system_feedback) VALUES (?, ?, ?, ?, ?)',
            [userId, bookingId || null, rating, comment, JSON.stringify(systemFeedback || {})]
        );
        return result;
    },

    async findById(id) {
        const [rows] = await dbPromise.query(
            `SELECT r.*, u.full_name as user_name, u.email as user_email, b.booking_date, b.start_time, b.end_time, rm.name as room_name
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             LEFT JOIN bookings b ON r.booking_id = b.id
             LEFT JOIN rooms rm ON b.room_id = rm.id
             WHERE r.id = ?`,
            [id]
        );
        if (rows.length > 0) {
            rows[0].system_feedback = rows[0].system_feedback ? JSON.parse(rows[0].system_feedback) : {};
        }
        return rows[0];
    },

    async findByUserId(userId) {
        const [rows] = await dbPromise.query(
            `SELECT r.*, b.booking_date, b.start_time, b.end_time, rm.name as room_name
             FROM reviews r
             LEFT JOIN bookings b ON r.booking_id = b.id
             LEFT JOIN rooms rm ON b.room_id = rm.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return rows.map(row => ({
            ...row,
            system_feedback: row.system_feedback ? JSON.parse(row.system_feedback) : {}
        }));
    },

    async findAll(filters = {}) {
        let query = `
            SELECT r.*, u.full_name as user_name, u.email as user_email, b.booking_date, b.start_time, b.end_time, rm.name as room_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN bookings b ON r.booking_id = b.id
            LEFT JOIN rooms rm ON b.room_id = rm.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND r.status = ?';
            params.push(filters.status);
        }

        if (filters.minRating) {
            query += ' AND r.rating >= ?';
            params.push(filters.minRating);
        }

        query += ' ORDER BY r.created_at DESC';

        const [rows] = await dbPromise.query(query, params);
        return rows.map(row => ({
            ...row,
            system_feedback: row.system_feedback ? JSON.parse(row.system_feedback) : {}
        }));
    },

    async update(id, userId, data) {
        const updates = [];
        const params = [];

        if (data.rating !== undefined) {
            updates.push('rating = ?');
            params.push(data.rating);
        }
        if (data.comment !== undefined) {
            updates.push('comment = ?');
            params.push(data.comment);
        }
        if (data.systemFeedback !== undefined) {
            updates.push('system_feedback = ?');
            params.push(JSON.stringify(data.systemFeedback));
        }

        if (updates.length === 0) return { affectedRows: 0 };

        params.push(id, userId);
        const [result] = await dbPromise.query(
            `UPDATE reviews SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );
        return result;
    },

    async delete(id, userId) {
        const [result] = await dbPromise.query(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result;
    },

    async hideReview(id) {
        const [result] = await dbPromise.query(
            'UPDATE reviews SET status = ? WHERE id = ?',
            ['hidden', id]
        );
        return result;
    },

    async unhideReview(id) {
        const [result] = await dbPromise.query(
            'UPDATE reviews SET status = ? WHERE id = ?',
            ['published', id]
        );
        return result;
    },

    async getAverageRating() {
        const [rows] = await dbPromise.query(
            'SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE status = ?',
            ['published']
        );
        return rows[0];
    },

    async getRatingDistribution() {
        const [rows] = await dbPromise.query(
            `SELECT rating, COUNT(*) as count 
             FROM reviews 
             WHERE status = ? 
             GROUP BY rating 
             ORDER BY rating DESC`,
            ['published']
        );
        return rows;
    }
};

module.exports = ReviewModel;
