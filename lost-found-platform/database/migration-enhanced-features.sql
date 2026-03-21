-- ============================================================
-- Migration: Add Password Reset and Enhanced Notifications
-- Adds reset_token fields and notification types
-- ============================================================

USE lost_found_db;

-- Add reset token fields to users table (for forgot password feature)
ALTER TABLE users ADD COLUMN reset_token VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL;

-- Add index on reset_token for faster lookups
CREATE INDEX idx_reset_token ON users(reset_token);

-- Add type field to notifications table
ALTER TABLE notifications ADD COLUMN type ENUM('match', 'reminder', 'police_suggestion', 'police_action', 'system') DEFAULT 'system';

-- Create police_stations table for police station details
CREATE TABLE IF NOT EXISTS police_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(100) DEFAULT NULL,
    district VARCHAR(100) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample police stations (Nepal Police stations)
INSERT IGNORE INTO police_stations (name, address, contact, district) VALUES
('Thamel Police Station', 'Thamel, Kathmandu', '+977-1-4212345', 'Kathmandu'),
('New Road Police Station', 'New Road, Kathmandu', '+977-1-4223456', 'Kathmandu'),
('Bhaktapur Police Station', 'Bhaktapur Durbar Square', '+977-1-6612345', 'Bhaktapur'),
('Pokhara Police Station', 'Pokhara Lakeside', '+977-61-462345', 'Kaski'),
('Lalitpur Police Station', 'Patan Durbar Square', '+977-1-5523456', 'Lalitpur');

-- Verify the changes
DESCRIBE users;
DESCRIBE notifications;
DESCRIBE police_stations;