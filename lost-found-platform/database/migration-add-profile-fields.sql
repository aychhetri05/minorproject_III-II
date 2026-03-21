-- Migration: Add phone and profile_picture_path to users table
-- Run this after schema.sql to add new profile fields

USE lost_found_db;

ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER role;
ALTER TABLE users ADD COLUMN profile_picture_path VARCHAR(500) DEFAULT NULL AFTER phone;
ALTER TABLE users ADD COLUMN verified_document_path VARCHAR(500) DEFAULT NULL AFTER profile_picture_path;