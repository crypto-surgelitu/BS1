/**
 * Complete Database Repair - Drop First
 * Uses MyISAM engine to bypass InnoDB tablespace issues
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });
const { DEFAULT_ADMIN, DEFAULT_SUPERADMIN } = require('../config/systemAccounts');

async function repairDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('Connected to database\n');

        console.log('0. Dropping existing tables...');
        const tables = ['users', 'rooms', 'bookings', 'reviews', 'system_settings'];
        for (const table of tables) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`   Dropped: ${table}`);
            } catch (err) {
                console.log(`   ${table}: ${err.message}`);
            }
        }
        console.log('');

        console.log('1. Creating users table...');
        await connection.query(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                failed_login_attempts INT DEFAULT 0,
                locked_until TIMESTAMP NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255) NULL,
                verification_expires TIMESTAMP NULL,
                password_reset_token VARCHAR(255) NULL,
                password_reset_expires TIMESTAMP NULL,
                password_reset_at TIMESTAMP NULL,
                login_otp VARCHAR(6) NULL,
                login_otp_expires TIMESTAMP NULL,
                totp_enabled BOOLEAN DEFAULT FALSE,
                totp_secret VARCHAR(255) NULL,
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   users table created\n');

        console.log('2. Creating rooms table...');
        await connection.query(`
            CREATE TABLE rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                space VARCHAR(255) NOT NULL,
                capacity INT NOT NULL,
                amenities JSON,
                status ENUM('Available', 'Reserved', 'Booked', 'Maintenance') DEFAULT 'Available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_capacity (capacity)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   rooms table created\n');

        console.log('3. Creating bookings table...');
        await connection.query(`
            CREATE TABLE bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                room_id INT NOT NULL,
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                type ENUM('booking', 'reservation') DEFAULT 'booking',
                status ENUM('pending', 'confirmed', 'rejected', 'cancelled') DEFAULT 'pending',
                notes TEXT,
                category ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT 'meeting',
                required_amenities JSON DEFAULT NULL,
                preferred_amenities JSON DEFAULT NULL,
                cancellation_reason VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_booking_date (booking_date),
                INDEX idx_user_id (user_id),
                INDEX idx_room_id (room_id),
                INDEX idx_status (status),
                INDEX idx_booking_slot (room_id, booking_date, start_time, end_time)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   bookings table created\n');

        console.log('4. Creating reviews table...');
        await connection.query(`
            CREATE TABLE reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                booking_id INT,
                rating INT NOT NULL,
                comment TEXT,
                system_feedback JSON,
                status ENUM('published', 'hidden') DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   reviews table created\n');

        console.log('5. Creating system_settings table...');
        await connection.query(`
            CREATE TABLE system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                description VARCHAR(255),
                updated_by INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_setting_key (setting_key)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   system_settings table created\n');

        console.log('6. Inserting default admin user...');
        await connection.query(
            'INSERT INTO users (email, password_hash, full_name, department, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [DEFAULT_ADMIN.email, DEFAULT_ADMIN.passwordHash, DEFAULT_ADMIN.fullName, DEFAULT_ADMIN.department, DEFAULT_ADMIN.role, true]
        );
        console.log('   Admin user created (email: admin@swahilipot.co.ke, password: admin@123)\n');

        console.log('6b. Inserting default superadmin user...');
        await connection.query(
            'INSERT INTO users (email, password_hash, full_name, department, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [DEFAULT_SUPERADMIN.email, DEFAULT_SUPERADMIN.passwordHash, DEFAULT_SUPERADMIN.fullName, DEFAULT_SUPERADMIN.department, DEFAULT_SUPERADMIN.role, true]
        );
        console.log('   Superadmin user created (email: superadmin@bs1.com, password: superadmin@123)\n');

        console.log('7. Inserting default system settings...');
        await connection.query(`
            INSERT INTO system_settings (setting_key, setting_value, description) VALUES
            ('working_hours_start', '08:00', 'Default booking start time'),
            ('working_hours_end', '18:00', 'Default booking end time'),
            ('maintenance_mode', 'false', 'System maintenance mode flag'),
            ('require_email_verification', 'true', 'Require email verification for new users'),
            ('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
            ('enable_multi_date_reservation', 'true', 'Allow multi-date reservations')
        `);
        console.log('   System settings inserted\n');

        console.log('8. Verifying tables...');
        const [tableList] = await connection.query('SHOW TABLES');
        console.log('   Created tables:', tableList.length);
        for (const table of tableList) {
            console.log(`   - ${Object.values(table)[0]}`);
        }

        console.log('\n========================================');
        console.log('  Database repair completed!');
        console.log('========================================\n');
        console.log('The login endpoint should now work correctly.');
        console.log('\nDefault admin login:');
        console.log('  Email: admin@swahilipot.co.ke');
        console.log('  Password: admin@123');
        console.log('\nDefault superadmin login:');
        console.log('  Email: superadmin@bs1.com');
        console.log('  Password: superadmin@123');
    } catch (error) {
        console.error('Database repair failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

repairDatabase();
