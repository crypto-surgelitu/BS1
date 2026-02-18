const { dbPromise } = require('../config/db');

/**
 * Analytics Controller
 * 
 * Provides booking insights and statistics for the admin dashboard.
 * 
 * UX Impact: Gives administrators visibility into booking patterns,
 * popular rooms, peak hours, and user activity to make data-driven
 * decisions about room management and scheduling.
 */
const analyticsController = {

    /**
     * GET /admin/analytics - Comprehensive booking analytics
     */
    async getAnalytics(req, res) {
        try {
            // 1. Total counts
            const [[totals]] = await dbPromise.query(`
                SELECT
                    (SELECT COUNT(*) FROM bookings) AS totalBookings,
                    (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS confirmedBookings,
                    (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pendingBookings,
                    (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') AS cancelledBookings,
                    (SELECT COUNT(*) FROM users WHERE role = 'user') AS totalUsers,
                    (SELECT COUNT(*) FROM rooms) AS totalRooms,
                    (SELECT COUNT(*) FROM rooms WHERE status = 'Available') AS availableRooms
            `);

            // 2. Bookings per room (most popular rooms)
            const [popularRooms] = await dbPromise.query(`
                SELECT r.name, r.space, COUNT(b.id) AS bookingCount
                FROM rooms r
                LEFT JOIN bookings b ON r.id = b.room_id AND b.status != 'cancelled'
                GROUP BY r.id, r.name, r.space
                ORDER BY bookingCount DESC
                LIMIT 10
            `);

            // 3. Bookings per day (last 30 days)
            const [bookingTrend] = await dbPromise.query(`
                SELECT 
                    DATE(booking_date) AS date,
                    COUNT(*) AS count
                FROM bookings
                WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(booking_date)
                ORDER BY date ASC
            `);

            // 4. Peak booking hours
            const [peakHours] = await dbPromise.query(`
                SELECT 
                    HOUR(start_time) AS hour,
                    COUNT(*) AS count
                FROM bookings
                WHERE status != 'cancelled'
                GROUP BY HOUR(start_time)
                ORDER BY count DESC
            `);

            // 5. Bookings by category
            const [byCategory] = await dbPromise.query(`
                SELECT 
                    COALESCE(category, 'meeting') AS category,
                    COUNT(*) AS count
                FROM bookings
                WHERE status != 'cancelled'
                GROUP BY category
                ORDER BY count DESC
            `);

            // 6. Recent activity (last 10 bookings)
            const [recentBookings] = await dbPromise.query(`
                SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, b.category,
                       u.full_name AS userName, u.email AS userEmail,
                       r.name AS roomName
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN rooms r ON b.room_id = r.id
                ORDER BY b.created_at DESC
                LIMIT 10
            `);

            // 7. Monthly booking count (last 6 months)
            const [monthlyTrend] = await dbPromise.query(`
                SELECT 
                    DATE_FORMAT(booking_date, '%Y-%m') AS month,
                    COUNT(*) AS count
                FROM bookings
                WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
                ORDER BY month ASC
            `);

            res.json({
                totals,
                popularRooms,
                bookingTrend,
                peakHours,
                byCategory,
                recentBookings,
                monthlyTrend,
                generatedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    },

    /**
     * GET /admin/analytics/users - User activity stats
     */
    async getUserStats(req, res) {
        try {
            const [userActivity] = await dbPromise.query(`
                SELECT 
                    u.id, u.full_name, u.email, u.department,
                    COUNT(b.id) AS totalBookings,
                    SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
                    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledBookings,
                    MAX(b.created_at) AS lastBooking
                FROM users u
                LEFT JOIN bookings b ON u.id = b.user_id
                WHERE u.role = 'user'
                GROUP BY u.id, u.full_name, u.email, u.department
                ORDER BY totalBookings DESC
                LIMIT 20
            `);

            res.json({ userActivity });
        } catch (error) {
            console.error('User stats error:', error);
            res.status(500).json({ error: 'Failed to fetch user stats' });
        }
    }
};

module.exports = analyticsController;
