// controllers/itemController.js
// Handles all item reporting and retrieval

const db = require('../config/db');
const { runMatching } = require('../services/matchingService');

/**
 * POST /api/items
 * Report a new lost or found item (authenticated users only)
 * AI matching is triggered automatically after creation
 */
const createItem = async (req, res) => {
    const { type, title, description, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!type || !title || !description) {
        return res.status(400).json({ message: 'Type, title, and description are required.' });
    }
    if (!['lost', 'found'].includes(type)) {
        return res.status(400).json({ message: 'Type must be "lost" or "found".' });
    }

    // If image uploaded via multer, save relative path
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [result] = await db.query(
            `INSERT INTO items (user_id, type, title, description, image_path, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, type, title, description, imagePath, latitude || null, longitude || null]
        );

        const newItemId = result.insertId;

        // ============================================================
        // AI MATCHING TRIGGERED HERE
        // After successfully saving the item, we run the matching engine
        // to find potential matches among existing open items.
        // This runs asynchronously — we don't wait for it to respond.
        // ============================================================
        const newItem = { id: newItemId, type, title, description };
        runMatching(newItem); // non-blocking

        res.status(201).json({
            message: 'Item reported successfully. AI matching in progress.',
            itemId: newItemId
        });
    } catch (err) {
        console.error('[CreateItem]', err.message);
        res.status(500).json({ message: 'Server error while creating item.' });
    }
};

/**
 * POST /api/items/:id/submit-physical
 * Found user submits the physical item to a police station
 */
const submitPhysical = async (req, res) => {
    const itemId = req.params.id;
    const userId = req.user.id;
    const { police_station, location_details } = req.body;

    try {
        // Ensure item exists and belongs to the found user
        const [items] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found.' });
        const item = items[0];
        if (item.user_id !== userId) return res.status(403).json({ message: 'Only the reporting user can submit this item.' });
        if (item.type !== 'found') return res.status(400).json({ message: 'Only found items can be submitted physically.' });

        // Create submission record
        const [result] = await db.query('INSERT INTO submissions (item_id, found_user_id, police_station, location_details) VALUES (?, ?, ?, ?)', [itemId, userId, police_station || null, location_details || null]);

        // Update item status and submission timestamp
        await db.query('UPDATE items SET status = ?, submission_timestamp = NOW() WHERE id = ?', ['pending_physical', itemId]);

        res.status(201).json({ message: 'Submission created, pending police verification.', submissionId: result.insertId });
    } catch (err) {
        console.error('[SubmitPhysical]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/items
 * Return all items (public)
 */
const getAllItems = async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, v.name AS verifier_name
             FROM items i
             JOIN users u ON i.user_id = u.id
             LEFT JOIN users v ON i.verified_by = v.id
             ORDER BY i.created_at DESC`
        );
        res.json(items);
    } catch (err) {
        console.error('[GetAllItems]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/items/open
 * Return only open items (public)
 */
const getOpenItems = async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT i.*, u.name AS reporter_name, v.name AS verifier_name
             FROM items i
             JOIN users u ON i.user_id = u.id
             LEFT JOIN users v ON i.verified_by = v.id
             WHERE i.status = 'open'
             ORDER BY i.created_at DESC`
        );
        res.json(items);
    } catch (err) {
        console.error('[GetOpenItems]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/items/:id
 * Return a single item with match info if available
 */
const getItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const [items] = await db.query(
            `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, v.name AS verifier_name
             FROM items i
             JOIN users u ON i.user_id = u.id
             LEFT JOIN users v ON i.verified_by = v.id
             WHERE i.id = ?`,
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        const item = items[0];

        // Fetch match info if this item was matched
        const [matches] = await db.query(
            `SELECT m.*, 
                    li.title AS lost_title, li.description AS lost_desc,
                    fi.title AS found_title, fi.description AS found_desc
             FROM matches m
             JOIN items li ON m.lost_item_id = li.id
             JOIN items fi ON m.found_item_id = fi.id
             WHERE m.lost_item_id = ? OR m.found_item_id = ?`,
            [id, id]
        );

        res.json({ ...item, match: matches[0] || null });
    } catch (err) {
        console.error('[GetItemById]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/items/matches (admin only)
 * Return all match records
 */
const getAllMatches = async (req, res) => {
    try {
        const [matches] = await db.query(
            `SELECT m.*,
                    li.title AS lost_title, li.description AS lost_desc, li.image_path AS lost_image,
                    fi.title AS found_title, fi.description AS found_desc, fi.image_path AS found_image,
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
        console.error('[GetAllMatches]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * PATCH /api/items/:id/status (admin only)
 * Update item status (open / matched / resolved)
 */
const updateItemStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'matched', 'verified', 'reported', 'pending_physical', 'physically_verified', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        await db.query('UPDATE items SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: `Item #${id} status updated to '${status}'.` });
    } catch (err) {
        console.error('[UpdateStatus]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * GET /api/admin/stats (admin only)
 * Summary statistics for the admin dashboard
 */
const getStats = async (req, res) => {
    try {
        const [[{ total }]]   = await db.query('SELECT COUNT(*) AS total FROM items');
        const [[{ lost }]]    = await db.query('SELECT COUNT(*) AS lost FROM items WHERE type="lost"');
        const [[{ found }]]   = await db.query('SELECT COUNT(*) AS found FROM items WHERE type="found"');
        const [[{ open }]]    = await db.query('SELECT COUNT(*) AS open FROM items WHERE status="open"');
        const [[{ matched }]] = await db.query('SELECT COUNT(*) AS matched FROM items WHERE status="matched"');
        const [[{ resolved }]]= await db.query('SELECT COUNT(*) AS resolved FROM items WHERE status="resolved"');
        const [[{ users }]]   = await db.query('SELECT COUNT(*) AS users FROM users');
        const [[{ totalMatches }]] = await db.query('SELECT COUNT(*) AS totalMatches FROM matches');

        res.json({ total, lost, found, open, matched, resolved, users, totalMatches });
    } catch (err) {
        console.error('[GetStats]', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { createItem, getAllItems, getOpenItems, getItemById, getAllMatches, updateItemStatus, getStats, submitPhysical };
