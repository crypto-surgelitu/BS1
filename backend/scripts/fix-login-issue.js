/**
 * Fix Database Schema for Login Issues
 * Run this script to add missing columns to the users table and create system_settings table
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function fixDatabase() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // 1. Add missing columns to users table
        console.log('1. Adding missing columns to users table...');
        
        const columnsToAdd = [
            { name: 'failed_login_attempts', def: 'INT DEFAULT 0' },
            { name: 'locked_until', def: 'TIMESTAMP NULL' },
            { name: 'email_verified', def: 'BOOLEAN DEFAULT FALSE' },
            { name: 'verification_token', def: 'VARCHAR(255) NULL' },
            { name: 'verification_expires', def: 'TIMESTAMP NULL' },
            { name: 'password_reset_token', def: 'VARCHAR(255) NULL' },
            { name: 'password_reset_expires', def: 'TIMESTAMP NULL' },
            { name: 'password_reset_at', def: 'TIMESTAMP NULL' },
            { name: 'login_otp', def: 'VARCHAR(6) NULL' },
            { name: 'login_otp_expires', def: 'TIMESTAMP NULL' },
            { name: 'totp_enabled', def: 'BOOLEAN DEFAULT FALSE' },
            { name: 'totp_secret', def: 'VARCHAR(255) NULL' }
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
                console.log(`   ✅ Added column: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`   ✅ Column already exists: ${col.name}`);
                } else {
                    throw err;
                }
            }
        }

        // 2. Update role enum to include super_admin
        console.log('\n2. Updating users table role enum...');
        try {
            await connection.query(
                "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user'"
            );
            console.log('   ✅ Role enum updated\n');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ Role enum already updated\n');
            } else {
                console.log('   ⚠️ Could not update role enum (may already be correct)\n');
            }
        }

        // 3. Create system_settings table
        console.log('3. Creating system_settings table...');
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT,
                    description VARCHAR(255),
                    updated_by INT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_setting_key (setting_key)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ system_settings table created\n');
        } catch (err) {
            console.log('   ✅ system_settings table already exists\n');
        }

        // 4. Insert default settings
        console.log('4. Inserting default system settings...');
        try {
            await connection.query(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('working_hours_start', '08:00', 'Default booking start time'),
                ('working_hours_end', '18:00', 'Default booking end time'),
                ('maintenance_mode', 'false', 'System maintenance mode flag'),
                ('require_email_verification', 'true', 'Require email verification for new users'),
                ('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
                ('enable_multi_date_reservation', 'true', 'Allow multi-date reservations')
                ON DUPLICATE KEY UPDATE setting_key = setting_key
            `);
            console.log('   ✅ Default settings inserted\n');
        } catch (err) {
            console.log('   ✅ Default settings already exist\n');
        }

        console.log('========================================');
        console.log('  Database fix completed successfully!');
        console.log('========================================\n');
        console.log('The login endpoint should now work correctly.');

    } catch (error) {
        console.error('❌ Database fix failed:', error.message);
        console.error('\nPlease ensure:');
        console.error('1. MySQL server is running');
        console.error('2. Database "' + process.env.DB_NAME + '" exists');
        console.error('3. Credentials in .env are correct');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDatabase();
