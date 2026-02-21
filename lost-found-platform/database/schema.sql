-- ============================================================
-- Centralized Lost and Recovery Platform
-- Database Schema for MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

-- ============================================================
-- TABLE: users
-- Stores all registered users (normal + admin/police)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- bcrypt hashed
    role ENUM('user', 'admin', 'police') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: items
-- Stores all lost and found item reports
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('lost', 'found') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_path VARCHAR(500) DEFAULT NULL,    -- local path to uploaded image
    latitude DECIMAL(10, 8) DEFAULT NULL,   -- GPS coordinates (optional)
    longitude DECIMAL(11, 8) DEFAULT NULL,
    status ENUM('open', 'matched', 'verified', 'reported', 'pending_physical', 'physically_verified', 'resolved') DEFAULT 'reported',
    physically_verified BOOLEAN DEFAULT FALSE,
    verification_type ENUM('AI','Physical') DEFAULT 'AI',
    verified_by INT DEFAULT NULL,
    verification_timestamp TIMESTAMP NULL DEFAULT NULL,
    police_notes TEXT DEFAULT NULL,
    submission_timestamp TIMESTAMP NULL DEFAULT NULL,
    storage_status ENUM('none', 'stored', 'closed') DEFAULT 'none',
    storage_details TEXT DEFAULT NULL,
    storage_updated_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: matches
-- Stores AI-matched pairs of lost and found items
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id INT NOT NULL,
    found_item_id INT NOT NULL,
    similarity_score DECIMAL(5, 4) NOT NULL,  -- value between 0 and 1
    verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    verified_by INT DEFAULT NULL,
    verification_timestamp TIMESTAMP NULL DEFAULT NULL,
    police_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_matches_lost  FOREIGN KEY (lost_item_id)  REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_matches_found FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: submissions
-- Records physical submission requests from found users to police stations
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    found_user_id INT NOT NULL,
    police_station VARCHAR(255) DEFAULT NULL,
    location_details TEXT DEFAULT NULL,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT DEFAULT NULL,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    CONSTRAINT fk_sub_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_user FOREIGN KEY (found_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: police_actions
-- Records actions taken by police officers for auditing
-- ============================================================
CREATE TABLE IF NOT EXISTS police_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    police_id INT DEFAULT NULL,
    action_type VARCHAR(100) NOT NULL,
    item_id INT DEFAULT NULL,
    match_id INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_police_user FOREIGN KEY (police_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_police_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
    CONSTRAINT fk_police_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: notifications
-- Notifications to users about police decisions and other events
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED: Default admin account (password: admin123)
-- ============================================================
INSERT IGNORE INTO users (name, email, password, role) VALUES (
    'Police Admin',
    'admin@nepalpolice.gov.np',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
);
-- NOTE: The hashed password above is for "password" (bcrypt).
-- Change this before deployment!
