require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            multipleStatements: true
        });

        console.log("Connected to MySQL server...");

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Running schema.sql...");
        await connection.query(schemaSql);

        console.log("Database initialized successfully!");
        await connection.end();
    } catch (err) {
        console.error("Failed to initialize database:", err);
    }
}

initDB();
