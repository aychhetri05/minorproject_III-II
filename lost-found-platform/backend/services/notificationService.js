const db = require('../config/db');
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { /* optional dependency not installed */ }
require('dotenv').config();

/**
 * Insert a notification into DB and optionally send email if SMTP configured
 * @param {number} userId
 * @param {string} message
 * @param {string} type - 'match', 'reminder', 'police_suggestion', 'police_action', 'system'
 */
const createNotification = async (userId, message, type = 'system') => {
    await db.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [userId, message, type]);

    // If SMTP configured and nodemailer available, attempt to send an email copy
    if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            // Fetch user email
            const [[user]] = await db.query('SELECT email, name FROM users WHERE id = ?', [userId]);
            if (user && user.email) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Lost & Found - Notification',
                    text: message
                });
            }
        } catch (err) {
            console.error('[NotificationService] Email send failed:', err.message);
        }
    }
};

module.exports = { createNotification };
