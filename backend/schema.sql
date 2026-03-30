-- SwahiliPot Hub Room Booking System Database Schema
-- Run this file to create all necessary tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Security & Authentication
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    -- Email Verification
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    verification_expires TIMESTAMP NULL,
    -- Password Reset
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP NULL,
    password_reset_at TIMESTAMP NULL,
    -- Login OTP (for post-password-reset verification)
    login_otp VARCHAR(6) NULL,
    login_otp_expires TIMESTAMP NULL,
    -- Two-Factor Authentication
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(255) NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    space VARCHAR(255) NOT NULL COMMENT 'Floor/Location',
    capacity INT NOT NULL,
    amenities JSON COMMENT 'Array of amenities',
    status ENUM('Available', 'Reserved', 'Booked', 'Maintenance') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_capacity (capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type ENUM('booking', 'reservation') DEFAULT 'booking',
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_booking_date (booking_date),
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_booking (room_id, booking_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    system_feedback JSON,
    status ENUM('published', 'hidden') DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
-- Note: This is a hashed version of 'admin123' using bcrypt
INSERT INTO users (email, password_hash, full_name, department, role) 
VALUES (
    'admin@swahilipothub.co.ke', 
    '$2b$10$MeRBMJH2l/L5Fe8DInQ2t.U.4ZLq5AVxc1YIc5yvMh/OqP3uMJVhS',
    'Admin User',
    'Administration',
    'admin'
) ON DUPLICATE KEY UPDATE email=email;

-- Insert default superadmin user (password: superadmin123)
INSERT INTO users (email, password_hash, full_name, department, role) 
VALUES (
    'superadmin@bs1.com', 
    '$2b$10$FuW/mbXzrfVwjQXzKuNOn/2vuM2YDtpkHz4BS0hOjvQtPyXn',
    'Super Admin',
    'Administration',
    'super_admin'
) ON DUPLICATE KEY UPDATE email=email;

-- Create system_settings table (needed for working hours during login)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('working_hours_start', '08:00', 'Default booking start time'),
('working_hours_end', '18:00', 'Default booking end time'),
('maintenance_mode', 'false', 'System maintenance mode flag'),
('require_email_verification', 'true', 'Require email verification for new users'),
('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
('enable_multi_date_reservation', 'true', 'Allow multi-date reservations')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Success message
SELECT 'Database schema created successfully!' AS message;
