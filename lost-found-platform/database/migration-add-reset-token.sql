-- ============================================================
-- Migration: Add Password Reset Functionality
-- Adds reset_token and reset_token_expiry fields to users table
-- ============================================================

USE lost_found_db;

-- Add reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL;

-- Optional: Add index on reset_token for faster lookups
CREATE INDEX idx_reset_token ON users(reset_token);

-- Verify the columns were added
DESCRIBE users;
