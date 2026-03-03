-- Migration: Add user preferences and booking requirements
-- Feature: Room Use Case & Requirements Specification
-- Date: March 3, 2026

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    required_amenities JSON DEFAULT NULL,
    preferred_amenities JSON DEFAULT NULL,
    default_use_case ENUM('meeting', 'event', 'training', 'co-working', 'other') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add required_amenities and preferred_amenities columns to bookings table
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS required_amenities JSON DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS preferred_amenities JSON DEFAULT NULL;

SELECT 'User preferences and booking requirements migration completed successfully!' AS message;
