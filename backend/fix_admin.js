require('dotenv').config();
const mysql = require('mysql2/promise');
const { DEFAULT_ADMIN, DEFAULT_SUPERADMIN, LEGACY_SYSTEM_EMAILS } = require('./config/systemAccounts');

const syncAccount = async (connection, account, legacyEmails = []) => {
    const [existing] = await connection.execute(
        `SELECT id, email
         FROM users
         WHERE role = ?
            OR email = ?
            OR email IN (${legacyEmails.map(() => '?').join(', ') || "''"})
         ORDER BY email = ? DESC, role = ? DESC, id ASC
         LIMIT 1`,
        [account.role, account.email, ...legacyEmails, account.email, account.role]
    );

    if (existing.length > 0) {
        await connection.execute(
            `UPDATE users
             SET email = ?, password_hash = ?, full_name = ?, department = ?, role = ?, email_verified = TRUE
             WHERE id = ?`,
            [account.email, account.passwordHash, account.fullName, account.department, account.role, existing[0].id]
        );
        console.log(`Updated ${account.role}: ${existing[0].email} -> ${account.email}`);
        return;
    }

    await connection.execute(
        'INSERT INTO users (email, password_hash, full_name, department, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [account.email, account.passwordHash, account.fullName, account.department, account.role, true]
    );
    console.log(`Created ${account.role}: ${account.email}`);
};

async function fixAdminAccounts() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('DB connection success');

        const [tables] = await connection.execute('SHOW TABLES');
        if (tables.length === 0) {
            console.error('No tables found. Database is empty.');
            return;
        }

        await syncAccount(connection, DEFAULT_ADMIN, LEGACY_SYSTEM_EMAILS);
        await syncAccount(connection, DEFAULT_SUPERADMIN);

        console.log('\nAdmin credentials synced:');
        console.log(`Admin: ${DEFAULT_ADMIN.email} / admin@123`);
        console.log(`Superadmin: ${DEFAULT_SUPERADMIN.email} / superadmin@123`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAdminAccounts();
