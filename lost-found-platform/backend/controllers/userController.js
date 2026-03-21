// controllers/userController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

/**
 * GET /api/users/profile
 * Get current user's profile data
 */
const getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, phone, profile_picture_path, verified_document_path, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(users[0]);
    } catch (err) {
        console.error('[GetProfile]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * PUT /api/users/profile
 * Update current user's profile (name, phone, profile picture)
 * Note: Email and password updates not allowed here for security
 */
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, phone } = req.body;

    // Validate inputs
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({ message: 'Invalid phone number format.' });
    }

    // If image and/or verified document uploaded via multer, save relative paths
    const profilePicturePath = req.files?.profilePicture?.[0] ? `/uploads/${req.files.profilePicture[0].filename}` : null;
    const verifiedDocumentPath = req.files?.verifiedDocument?.[0] ? `/uploads/${req.files.verifiedDocument[0].filename}` : null;

    try {
        // Build update query dynamically
        let updateFields = 'name = ?';
        let params = [name];

        if (phone !== undefined) {
            updateFields += ', phone = ?';
            params.push(phone);
        }

        if (profilePicturePath) {
            updateFields += ', profile_picture_path = ?';
            params.push(profilePicturePath);
        }

        if (verifiedDocumentPath) {
            updateFields += ', verified_document_path = ?';
            params.push(verifiedDocumentPath);
        }

        params.push(userId);

        await db.query(`UPDATE users SET ${updateFields} WHERE id = ?`, params);

        // Return updated profile
        const [updated] = await db.query(
            'SELECT id, name, email, role, phone, profile_picture_path, verified_document_path, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            message: 'Profile updated successfully.',
            user: updated[0]
        });
    } catch (err) {
        console.error('[UpdateProfile]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getProfile, updateProfile };