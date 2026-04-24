require('dotenv').config();
const { dbPromise } = require('./config/db');

async function run() {
  try {
    const db = await dbPromise;
    console.log('Dropping existing audit_logs table...');
    await db.query('DROP TABLE IF EXISTS audit_logs;');
    
    console.log('Creating new audit_logs table...');
    const createTableQuery = `
      CREATE TABLE audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id INT,
          old_value TEXT,
          new_value TEXT,
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_entity_type (entity_type),
          INDEX idx_created_at (created_at)
      );
    `;
    await db.query(createTableQuery);
    console.log('audit_logs table recreated successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    process.exit(0);
  }
}

run();
