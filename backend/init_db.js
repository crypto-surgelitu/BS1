require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log("Connected to MySQL server...");

        const dbName = process.env.DB_NAME || 'swahilipot_booking';
        console.log(`Creating database '${dbName}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log("Running schema.sql...");
        await connection.query(schemaSql);

        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            console.log("Running seed.sql...");
            await connection.query(seedSql);
        }

        console.log("Database initialized and seeded successfully!");
        await connection.end();
    } catch (err) {
        console.error("Failed to initialize database:", err);
    }
}

initDB();
