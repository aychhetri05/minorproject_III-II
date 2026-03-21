const db = require('../config/db');
const bcrypt = require('bcrypt');
const { createNotification } = require('../services/notificationService');
require('dotenv').config();

const SALT_ROUNDS = 10;

/**
 * POST /api/admin/create-police
 * body: { name, email, password? }
 * Protected by adminMiddleware
 */
const createPoliceUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email) return res.status(400).json({ message: 'Name and email required.' });

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ message: 'Email already exists.' });

        // Generate a password if not provided
        const plain = password || Math.random().toString(36).slice(-10) + Math.floor(Math.random()*90+10);
        const hashed = await bcrypt.hash(plain, SALT_ROUNDS);

        const [result] = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashed, 'police']);

        // Notify the newly created police account (DB + optional email)
        try { await createNotification(result.insertId, `Your police account has been created. Login email: ${email}`, 'system'); } catch (e) { console.error(e.message); }

        res.status(201).json({ message: 'Police account created.', userId: result.insertId, tempPassword: password ? undefined : plain });
    } catch (err) {
        console.error('[CreatePolice]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { createPoliceUser };
