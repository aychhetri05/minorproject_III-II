// services/schedulerService.js
// Handles scheduled tasks for the application

const { check24HourReminders } = require('./reminderService');

/**
 * Start the scheduler service
 * Runs reminder checks every hour
 */
const startScheduler = () => {
    console.log('[Scheduler] Starting scheduled tasks...');

    // Check for 24-hour reminders every hour
    const reminderInterval = setInterval(async () => {
        try {
            const count = await check24HourReminders();
            if (count > 0) {
                console.log(`[Scheduler] Processed ${count} reminder notifications`);
            }
        } catch (err) {
            console.error('[Scheduler] Error in reminder check:', err.message);
        }
    }, 60 * 60 * 1000); // Every hour

    // Run initial check after 1 minute (for testing)
    setTimeout(async () => {
        try {
            const count = await check24HourReminders();
            console.log(`[Scheduler] Initial reminder check completed (${count} items)`);
        } catch (err) {
            console.error('[Scheduler] Error in initial reminder check:', err.message);
        }
    }, 60 * 1000); // 1 minute after startup

    console.log('[Scheduler] Reminder service active - checking every hour');

    // Return cleanup function
    return () => {
        clearInterval(reminderInterval);
        console.log('[Scheduler] Scheduler stopped');
    };
};

module.exports = { startScheduler };