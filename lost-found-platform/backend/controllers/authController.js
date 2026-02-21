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

module.exports = { register, login };
