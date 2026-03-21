// services/reminderService.js
// Handles scheduled reminders for lost items without matches

const db = require('../config/db');
const { createNotification } = require('./notificationService');

/**
 * Check for lost items that have been open for 24+ hours without matches
 * and send police reporting suggestions
 */
const check24HourReminders = async () => {
    try {
        console.log('[ReminderService] Checking for 24-hour no-match reminders...');

        // Find lost items that:
        // 1. Are still 'open' (not matched)
        // 2. Created more than 24 hours ago
        // 3. Have no matches in the matches table
        const [lostItems] = await db.query(`
            SELECT i.id, i.title, i.user_id, i.created_at, u.name as owner_name
            FROM items i
            JOIN users u ON i.user_id = u.id
            WHERE i.type = 'lost'
            AND i.status IN ('open', 'reported')
            AND i.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND i.id NOT IN (
                SELECT DISTINCT lost_item_id FROM matches
                UNION
                SELECT DISTINCT found_item_id FROM matches WHERE found_item_id IN (
                    SELECT id FROM items WHERE type = 'lost'
                )
            )
        `);

        console.log(`[ReminderService] Found ${lostItems.length} lost items eligible for reminders`);

        for (const item of lostItems) {
            // Check if we've already sent a reminder for this item
            const [existingReminder] = await db.query(`
                SELECT id FROM notifications
                WHERE user_id = ? AND type = 'police_suggestion'
                AND message LIKE CONCAT('%', ?, '%')
            `, [item.user_id, item.title]);

            if (existingReminder.length === 0) {
                // Send reminder in English
                const englishMessage = `No match has been found for your item "${item.title}" within 24 hours. You can report this to Nepal Police online at https://nepalpolice.gov.np/`;

                // Send reminder in Nepali
                const nepaliMessage = `२४ घण्टाभित्र तपाईंको सामान "${item.title}" को कुनै मिल्दो फेला परेन। तपाईं नेपाल प्रहरीमा अनलाइन रिपोर्ट गर्न सक्नुहुन्छ: https://nepalpolice.gov.np/`;

                // Create notifications (both languages)
                await createNotification(item.user_id, englishMessage, 'police_suggestion');
                await createNotification(item.user_id, nepaliMessage, 'police_suggestion');

                console.log(`[ReminderService] 📢 Sent 24-hour reminder to ${item.owner_name} for item "${item.title}"`);
            }
        }

        return lostItems.length;
    } catch (err) {
        console.error('[ReminderService] Error in check24HourReminders:', err.message);
        return 0;
    }
};

/**
 * Get police station details for a submission
 * @param {number} submissionId
 * @returns {Object|null} Police station details or null
 */
const getPoliceStationDetails = async (submissionId) => {
    try {
        const [rows] = await db.query(`
            SELECT ps.name, ps.address, ps.contact, ps.district, ps.latitude, ps.longitude
            FROM submissions s
            JOIN police_stations ps ON s.police_station = ps.name
            WHERE s.id = ?
        `, [submissionId]);

        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error('[ReminderService] Error getting police station details:', err.message);
        return null;
    }
};

module.exports = {
    check24HourReminders,
    getPoliceStationDetails
};