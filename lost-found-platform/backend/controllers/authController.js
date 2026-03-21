// controllers/authController.js
// Handles user registration and login

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
require('dotenv').config();

const SALT_ROUNDS = 10;

/**
 * POST /api/register
 * Register a new user account
 */
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        // Check if email already exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Prevent users from self-assigning admin or police role
        const assignedRole = (role === 'admin' || role === 'police') ? 'user' : (role || 'user');

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, assignedRole]
        );

        res.status(201).json({
            message: 'User registered successfully.',
            userId: result.insertId
        });
    } catch (err) {
        console.error('[Register]', err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * POST /api/login
 * Authenticate user and return JWT token
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = rows[0];

        // Compare password with hashed version
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT token (expires in 24 hours)
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('[Login]', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and send reset link
 * (Currently logs to console; can integrate email service later)
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    // Validate email
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // Check if user exists
        const [rows] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            // Don't reveal if email exists or not (security best practice)
            return res.status(200).json({
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        const user = rows[0];

        // Generate a random reset token (JWT token with short expiry)
        // Alternative: use crypto.randomBytes for non-JWT token
        const resetToken = jwt.sign(
            { id: user.id, email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Reset link valid for 15 minutes
        );

        // Calculate expiry time (15 minutes from now)
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

        // Save token and expiry in database
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, expiryTime, user.id]
        );

        // Log the reset link (in production, send via email)
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        console.log(`\n🔐 PASSWORD RESET LINK FOR ${email}:\n${resetLink}\n`);

        res.status(200).json({
            message: 'If an account with this email exists, a password reset link has been sent.',
            // DELETE IN PRODUCTION: Only for development/testing
            resetLink
        });
    } catch (err) {
        console.error('[ForgotPassword]', err.message);
        res.status(500).json({ message: 'Server error during password reset request.' });
    }
};

/**
 * POST /api/auth/reset-password/:token
 * Verify reset token and update user's password
 */
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token) {
        return res.status(400).json({ message: 'Reset token is required.' });
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'New password and confirmation are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Verify the JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ message: 'Invalid or expired reset token.' });
        }

        // Find user and verify token matches
        const [rows] = await db.query(
            'SELECT id, email FROM users WHERE id = ? AND reset_token = ?',
            [decoded.id, token]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid or expired reset token.' });
        }

        const user = rows[0];

        // Check token expiry
        const [expiryRows] = await db.query(
            'SELECT reset_token_expiry FROM users WHERE id = ?',
            [user.id]
        );

        if (expiryRows.length === 0 || !expiryRows[0].reset_token_expiry) {
            return res.status(401).json({ message: 'Reset token has expired.' });
        }

        const expiryTime = new Date(expiryRows[0].reset_token_expiry);
        if (expiryTime < new Date()) {
            return res.status(401).json({ message: 'Reset token has expired.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password and clear reset token fields
        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (err) {
        console.error('[ResetPassword]', err.message);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

module.exports = { register, login, forgotPassword, resetPassword };
