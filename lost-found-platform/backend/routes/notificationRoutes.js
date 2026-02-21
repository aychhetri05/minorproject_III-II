const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (err) {
        console.error('[GetNotifications]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error('[MarkNotificationRead]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
