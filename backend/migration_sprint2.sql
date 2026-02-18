-- ============================================================
-- BS1 Migration: Sprint 2 Security Features
-- Date: 2026-02-18
-- Description: Adds email verification, password reset, and
--              account lockout columns to the users table.
--              Also creates audit_logs and sessions tables.
-- ============================================================

-- 1. Email Verification columns
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS verification_expires DATETIME DEFAULT NULL;

-- 2. Password Reset columns
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME DEFAULT NULL;

-- 3. Account Lockout columns
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until DATETIME DEFAULT NULL;

-- 4. Two-Factor Authentication columns
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- 5. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT NULL COMMENT 'e.g. booking, room, user',
    entity_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Waitlist table (UX feature)
CREATE TABLE IF NOT EXISTS waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    desired_date DATE NOT NULL,
    desired_start TIME NOT NULL,
    desired_end TIME NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_date (room_id, desired_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Add notes and category to bookings
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS category ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT 'meeting';

SELECT 'Sprint 2 migration completed successfully!' AS message;
