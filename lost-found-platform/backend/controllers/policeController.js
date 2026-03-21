const db = require('../config/db');
const { createNotification } = require('../services/notificationService');

/**
 * GET /api/police/items
 * Query params: type, status, location, startDate, endDate
 */
const getItems = async (req, res) => {
    const { type, status, location, startDate, endDate } = req.query;

    try {
        let sql = `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone,
                          pu.name AS verifier_name,
                          m.id AS match_id, m.similarity_score, m.verification_status
                   FROM items i
                   JOIN users u ON i.user_id = u.id
                   LEFT JOIN users pu ON i.verified_by = pu.id
                   LEFT JOIN matches m ON (m.lost_item_id = i.id OR m.found_item_id = i.id)
                   WHERE 1=1`;
        const params = [];

        if (type) { sql += ' AND i.type = ?'; params.push(type); }
        if (status) { sql += ' AND i.status = ?'; params.push(status); }
        if (location) { sql += ' AND (i.title LIKE ? OR i.description LIKE ?)'; params.push('%'+location+'%', '%'+location+'%'); }
        if (startDate) { sql += ' AND i.created_at >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND i.created_at <= ?'; params.push(endDate); }

        sql += ' ORDER BY i.created_at DESC';

        const [items] = await db.query(sql, params);
        res.json(items);
    } catch (err) {
        console.error('[PoliceGetItems]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/police/matches
 */
const getMatches = async (req, res) => {
    try {
        const [matches] = await db.query(
            `SELECT m.*, 
                    li.title AS lost_title, fi.title AS found_title,
                    lu.name AS lost_reporter, fu.name AS found_reporter
             FROM matches m
             JOIN items li ON m.lost_item_id = li.id
             JOIN items fi ON m.found_item_id = fi.id
             JOIN users lu ON li.user_id = lu.id
             JOIN users fu ON fi.user_id = fu.id
             ORDER BY m.created_at DESC`
        );
        res.json(matches);
    } catch (err) {
        console.error('[PoliceGetMatches]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/matches/:id/verify
 */
const verifyMatch = async (req, res) => {
    const matchId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        // Update match record
        await db.query(
            `UPDATE matches SET verification_status = 'verified', verified_by = ?, verification_timestamp = NOW(), police_notes = ? WHERE id = ?`,
            [policeId, notes || null, matchId]
        );

        // Fetch matched item ids
        const [[m]] = await db.query('SELECT lost_item_id, found_item_id FROM matches WHERE id = ?', [matchId]);
        if (!m) return res.status(404).json({ message: 'Match not found.' });

        // Mark both items as verified
        await db.query('UPDATE items SET status = ? WHERE id IN (?, ?)', ['verified', m.lost_item_id, m.found_item_id]);

        // Log police action
        await db.query('INSERT INTO police_actions (police_id, action_type, match_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'verify_match', matchId, notes || null]);

        // Notify involved users
        const [[lostReporter]] = await db.query('SELECT user_id FROM items WHERE id = ?', [m.lost_item_id]);
        const [[foundReporter]] = await db.query('SELECT user_id FROM items WHERE id = ?', [m.found_item_id]);

        const msg = `Police verified a match (match #${matchId}). Please follow up for handover.`;
        if (lostReporter && lostReporter.user_id) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [lostReporter.user_id, msg]);
        }
        if (foundReporter && foundReporter.user_id) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [foundReporter.user_id, msg]);
        }

        res.json({ message: 'Match verified successfully.' });
    } catch (err) {
        console.error('[VerifyMatch]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/matches/:id/reject
 */
const rejectMatch = async (req, res) => {
    const matchId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        await db.query(
            `UPDATE matches SET verification_status = 'rejected', verified_by = ?, verification_timestamp = NOW(), police_notes = ? WHERE id = ?`,
            [policeId, notes || null, matchId]
        );

        // Fetch matched item ids and set their status back to open
        const [[m]] = await db.query('SELECT lost_item_id, found_item_id FROM matches WHERE id = ?', [matchId]);
        if (!m) return res.status(404).json({ message: 'Match not found.' });

        await db.query('UPDATE items SET status = ? WHERE id IN (?, ?)', ['open', m.lost_item_id, m.found_item_id]);

        // Log action
        await db.query('INSERT INTO police_actions (police_id, action_type, match_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'reject_match', matchId, notes || null]);

        // Notify involved users
        const [[lostReporter]] = await db.query('SELECT user_id FROM items WHERE id = ?', [m.lost_item_id]);
        const [[foundReporter]] = await db.query('SELECT user_id FROM items WHERE id = ?', [m.found_item_id]);

        const msg = `Police rejected a match (match #${matchId}). Please review your report.`;
        if (lostReporter && lostReporter.user_id) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [lostReporter.user_id, msg]);
        }
        if (foundReporter && foundReporter.user_id) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [foundReporter.user_id, msg]);
        }

        res.json({ message: 'Match rejected and items reopened.' });
    } catch (err) {
        console.error('[RejectMatch]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/items/:id/store
 * body: { notes }
 */
const markStored = async (req, res) => {
    const itemId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        await db.query('UPDATE items SET storage_status = ?, storage_details = ?, storage_updated_at = NOW() WHERE id = ?', ['stored', notes || null, itemId]);
        await db.query('INSERT INTO police_actions (police_id, action_type, item_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'mark_stored', itemId, notes || null]);
        res.json({ message: 'Item marked as stored in police station.' });
    } catch (err) {
        console.error('[MarkStored]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * PUT /api/police/items/:id/verify-physical
 * Mark an item as physically received and verified by police
 * body: { notes }
 */
const verifyPhysical = async (req, res) => {
    const itemId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        // Get item details
        const [[item]] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        // Check if item is of type 'found'
        if (item.type !== 'found') {
            return res.status(400).json({ message: 'Only found items can be physically verified.' });
        }

        // Update item with verification details
        await db.query(
            `UPDATE items SET physically_verified = TRUE, verification_type = 'Physical', 
             verified_by = ?, verification_timestamp = NOW(), police_notes = ?, 
             status = 'physically_verified' WHERE id = ?`,
            [policeId, notes || null, itemId]
        );

        // Create audit log for this action
        await db.query(
            'INSERT INTO police_actions (police_id, action_type, item_id, notes) VALUES (?, ?, ?, ?)',
            [policeId, 'verify_physical', itemId, notes || null]
        );

        // Send notification to found user
        const [[itemData]] = await db.query('SELECT user_id FROM items WHERE id = ?', [itemId]);
        if (itemData && itemData.user_id) {
            const msg = `Your found item #${itemId} has been physically verified by police. ✔`;
            try {
                await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [itemData.user_id, msg]);
            } catch (notifErr) {
                console.error('[VerifyPhysicalNotification]', notifErr.message);
            }
        }

        res.json({ 
            message: 'Item marked as physically verified.',
            itemId: itemId
        });
    } catch (err) {
        console.error('[VerifyPhysical]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/police/pending-physical
 * Get items pending physical verification
 */
const getPendingPhysical = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone,
                    pu.name AS verifier_name
             FROM items i
             JOIN users u ON i.user_id = u.id
             LEFT JOIN users pu ON i.verified_by = pu.id
             WHERE i.type = 'found' AND i.status = 'pending_physical'
             ORDER BY i.submission_timestamp DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('[GetPendingPhysical]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/items/:id/close
 * body: { notes }
 */
const markClosed = async (req, res) => {
    const itemId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        await db.query('UPDATE items SET storage_status = ?, status = ?, storage_details = ?, storage_updated_at = NOW() WHERE id = ?', ['closed', 'resolved', notes || null, itemId]);
        await db.query('INSERT INTO police_actions (police_id, action_type, item_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'mark_closed', itemId, notes || null]);
        res.json({ message: 'Item marked closed/resolved by police.' });
    } catch (err) {
        console.error('[MarkClosed]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/police/submissions
 * List pending physical submissions
 */
const getSubmissions = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, i.title AS item_title, u.name AS found_user_name, u.email AS found_user_email, u.phone AS found_user_phone
             FROM submissions s
             JOIN items i ON s.item_id = i.id
             JOIN users u ON s.found_user_id = u.id
             WHERE s.status = 'pending'
             ORDER BY s.submission_timestamp DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('[GetSubmissions]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/submissions/:id/accept
 */
const acceptSubmission = async (req, res) => {
    const subId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        const [[sub]] = await db.query('SELECT * FROM submissions WHERE id = ?', [subId]);
        if (!sub) return res.status(404).json({ message: 'Submission not found.' });

        // mark submission accepted
        await db.query('UPDATE submissions SET status = ?, processed_by = ?, processed_at = NOW(), notes = ? WHERE id = ?', ['accepted', policeId, notes || null, subId]);

        // update item verification fields
        await db.query(
            `UPDATE items SET physically_verified = TRUE, verification_type = 'Physical', verified_by = ?, verification_timestamp = NOW(), police_notes = ?, status = ? WHERE id = ?`,
            [policeId, notes || null, 'physically_verified', sub.item_id]
        );

        // log police action
        await db.query('INSERT INTO police_actions (police_id, action_type, item_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'accept_submission', sub.item_id, notes || null]);

        // notify found user and item reporter
        const msgFound = `Your physical submission for item #${sub.item_id} was accepted by police.`;
        await createNotification(sub.found_user_id, msgFound, 'police_action');

        const [[itemRow]] = await db.query('SELECT user_id FROM items WHERE id = ?', [sub.item_id]);
        if (itemRow && itemRow.user_id) {
            await createNotification(itemRow.user_id, `Item #${sub.item_id} has been physically verified by police.`, 'police_action');
        }

        res.json({ message: 'Submission accepted and item physically verified.' });
    } catch (err) {
        console.error('[AcceptSubmission]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/police/submissions/:id/reject
 */
const rejectSubmission = async (req, res) => {
    const subId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        const [[sub]] = await db.query('SELECT * FROM submissions WHERE id = ?', [subId]);
        if (!sub) return res.status(404).json({ message: 'Submission not found.' });

        await db.query('UPDATE submissions SET status = ?, processed_by = ?, processed_at = NOW(), notes = ? WHERE id = ?', ['rejected', policeId, notes || null, subId]);

        // revert item status to reported
        await db.query('UPDATE items SET status = ? WHERE id = ?', ['reported', sub.item_id]);

        // log
        await db.query('INSERT INTO police_actions (police_id, action_type, item_id, notes) VALUES (?, ?, ?, ?)', [policeId, 'reject_submission', sub.item_id, notes || null]);

        // notify found user
        await createNotification(sub.found_user_id, `Your physical submission for item #${sub.item_id} was rejected by police. Notes: ${notes || ''}`, 'police_action');

        res.json({ message: 'Submission rejected.' });
    } catch (err) {
        console.error('[RejectSubmission]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getItems, getMatches, verifyMatch, rejectMatch, markStored, markClosed, getSubmissions, acceptSubmission, rejectSubmission, verifyPhysical, getPendingPhysical };
