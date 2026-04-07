require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');
const { DEFAULT_ADMIN, DEFAULT_SUPERADMIN, LEGACY_SYSTEM_EMAILS } = require('../config/systemAccounts');

const bookingColumns = [
    ['notes', 'ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL'],
    ['category', "ALTER TABLE bookings ADD COLUMN category ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT 'meeting'"],
    ['required_amenities', 'ALTER TABLE bookings ADD COLUMN required_amenities JSON DEFAULT NULL'],
    ['preferred_amenities', 'ALTER TABLE bookings ADD COLUMN preferred_amenities JSON DEFAULT NULL']
];

const hasColumn = async (connection, tableName, columnName) => {
    const [rows] = await connection.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?`,
        [tableName, columnName]
    );
    return rows.length > 0;
};

const hasIndex = async (connection, tableName, indexName) => {
    const [rows] = await connection.query(
        `SELECT 1
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND index_name = ?`,
        [tableName, indexName]
    );
    return rows.length > 0;
};

const syncAccount = async (connection, account, legacyEmails = []) => {
    const placeholders = legacyEmails.length > 0 ? legacyEmails.map(() => '?').join(', ') : null;
    const sql = `
        SELECT id, email
        FROM users
        WHERE role = ?
           OR email = ?
           ${placeholders ? `OR email IN (${placeholders})` : ''}
        ORDER BY email = ? DESC, role = ? DESC, id ASC
        LIMIT 1
    `;
    const params = [account.role, account.email, ...legacyEmails, account.email, account.role];
    const [rows] = await connection.query(sql, params);

    if (rows.length > 0) {
        await connection.query(
            `UPDATE users
             SET email = ?, password_hash = ?, full_name = ?, department = ?, role = ?, email_verified = TRUE
             WHERE id = ?`,
            [account.email, account.passwordHash, account.fullName, account.department, account.role, rows[0].id]
        );
        console.log(`Synced ${account.role} account: ${rows[0].email} -> ${account.email}`);
        return;
    }

    await connection.query(
        `INSERT INTO users (email, password_hash, full_name, department, role, email_verified)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [account.email, account.passwordHash, account.fullName, account.department, account.role]
    );
    console.log(`Created ${account.role} account: ${account.email}`);
};

async function applySystemFixes() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to database');

        await connection.query(
            "ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'rejected', 'cancelled') DEFAULT 'pending'"
        );
        console.log('Aligned booking status enum');

        for (const [columnName, sql] of bookingColumns) {
            if (!(await hasColumn(connection, 'bookings', columnName))) {
                await connection.query(sql);
                console.log(`Added bookings.${columnName}`);
            }
        }

        if (await hasIndex(connection, 'bookings', 'unique_booking')) {
            await connection.query('ALTER TABLE bookings DROP INDEX unique_booking');
            console.log('Dropped blocking unique_booking index');
        }

        if (!(await hasIndex(connection, 'bookings', 'idx_booking_slot'))) {
            await connection.query('CREATE INDEX idx_booking_slot ON bookings (room_id, booking_date, start_time, end_time)');
            console.log('Created idx_booking_slot index');
        }

        await syncAccount(connection, DEFAULT_ADMIN, LEGACY_SYSTEM_EMAILS);
        await syncAccount(connection, DEFAULT_SUPERADMIN);

        console.log('\nSystem fixes applied successfully.');
        console.log(`Admin: ${DEFAULT_ADMIN.email} / admin@123`);
        console.log(`Superadmin: ${DEFAULT_SUPERADMIN.email} / superadmin@123`);
    } catch (error) {
        console.error('Failed to apply system fixes:', error.message);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

applySystemFixes();
