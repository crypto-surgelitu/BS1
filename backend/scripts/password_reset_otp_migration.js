/**
 * Password Reset OTP Migration
 * This script adds columns to track password reset OTP for post-reset login verification
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function runMigration() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // 1. Add password_reset_at column
        console.log('1. Adding password_reset_at column...');
        try {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN password_reset_at TIMESTAMP NULL AFTER password_reset_expires
            `);
            console.log('   ✅ password_reset_at column added\n');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ password_reset_at column already exists\n');
            } else {
                throw err;
            }
        }

        // 2. Add login_otp column for OTP verification
        console.log('2. Adding login_otp column...');
        try {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN login_otp VARCHAR(6) NULL AFTER password_reset_at,
                ADD COLUMN login_otp_expires TIMESTAMP NULL AFTER login_otp
            `);
            console.log('   ✅ login_otp column added\n');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ login_otp column already exists\n');
            } else {
                throw err;
            }
        }

        console.log('========================================');
        console.log('  Password Reset OTP Migration completed!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
