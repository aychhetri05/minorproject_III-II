// services/matchingService.js
// ============================================================
// AI MATCHING ENGINE
// Uses NLP techniques from the 'natural' library:
//   1. Tokenization     - splits text into words
//   2. Stemming         - reduces words to root form
//   3. TF-IDF           - weighs term importance
//   4. Cosine Similarity - measures vector similarity
// ============================================================

const natural = require('natural');
const db = require('../config/db');
const { createNotification } = require('./notificationService');
require('dotenv').config();

const tokenizer  = new natural.WordTokenizer();
const stemmer    = natural.PorterStemmer;
const THRESHOLD  = parseFloat(process.env.MATCH_THRESHOLD) || 0.3;

/**
 * Preprocess text: lowercase, tokenize, stem
 * Example: "Red Wallet found near Thamel" 
 *       -> ["red", "wallet", "found", "near", "thamel"]
 *       -> ["red", "wallet", "found", "near", "thamel"] (stemmed)
 */
function preprocessText(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    return tokens.map(token => stemmer.stem(token));
}

/**
 * Build term frequency map from token array
 */
function buildTF(tokens) {
    const tf = {};
    tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
    });
    return tf;
}

/**
 * Calculate cosine similarity between two TF maps
 * Returns a score between 0 (no match) and 1 (perfect match)
 */
function cosineSimilarity(tf1, tf2) {
    // Get all unique terms across both documents
    const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allTerms.forEach(term => {
        const v1 = tf1[term] || 0;
        const v2 = tf2[term] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Main matching function — called after a new item is reported.
 * 
 * Logic:
 *   - If new item is "lost"  → compare against all open "found" items
 *   - If new item is "found" → compare against all open "lost"  items
 *   - If similarity > THRESHOLD → insert match record, update both statuses
 * 
 * @param {Object} newItem - The newly reported item {id, type, title, description}
 */
async function runMatching(newItem) {
    try {
        const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';

        // Fetch all available items of the opposite type (allow both 'open' and legacy 'reported')
        const [candidates] = await db.query(
            `SELECT id, title, description FROM items 
             WHERE type = ? AND status IN ('open', 'reported') AND id != ?`,
            [oppositeType, newItem.id]
        );

        if (candidates.length === 0) {
            console.log(`[Matching] No open ${oppositeType} items to compare against.`);
            return;
        }

        // Prepare text for the new item
        const newText     = `${newItem.title} ${newItem.description}`;
        const newTokens   = preprocessText(newText);
        const newTF       = buildTF(newTokens);

        console.log(`[Matching] Comparing new ${newItem.type} item #${newItem.id} against ${candidates.length} ${oppositeType} items...`);

        let bestMatch = null;
        let bestScore = 0;

        for (const candidate of candidates) {
            const candidateText   = `${candidate.title} ${candidate.description}`;
            const candidateTokens = preprocessText(candidateText);
            const candidateTF     = buildTF(candidateTokens);

            // Calculate cosine similarity
            const score = cosineSimilarity(newTF, candidateTF);

            console.log(`[Matching]   -> Item #${candidate.id}: similarity = ${score.toFixed(4)}`);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        // If best score exceeds threshold → record match
        if (bestScore >= THRESHOLD && bestMatch) {
            console.log(`[Matching] ✅ Match found! Score: ${bestScore.toFixed(4)}`);

            // Determine which is lost and which is found for the matches table
            const lostItemId  = newItem.type === 'lost'  ? newItem.id : bestMatch.id;
            const foundItemId = newItem.type === 'found' ? newItem.id : bestMatch.id;

            // Insert match record
            await db.query(
                `INSERT INTO matches (lost_item_id, found_item_id, similarity_score) VALUES (?, ?, ?)`,
                [lostItemId, foundItemId, bestScore.toFixed(4)]
            );

            // Update both items to 'matched'
            await db.query(
                `UPDATE items SET status = 'matched' WHERE id IN (?, ?)`,
                [newItem.id, bestMatch.id]
            );

            // ============================================================
            // NOTIFICATION TRIGGER: Notify the lost item owner about the match
            // ============================================================
            try {
                // Get the lost item details and owner
                const [lostItemRows] = await db.query(
                    `SELECT i.*, u.name as owner_name FROM items i
                     JOIN users u ON i.user_id = u.id
                     WHERE i.id = ?`,
                    [lostItemId]
                );

                if (lostItemRows.length > 0) {
                    const lostItem = lostItemRows[0];
                    const matchMessage = `A possible match has been found for your lost item "${lostItem.title}". Please check your dashboard for details. Match confidence: ${(bestScore * 100).toFixed(1)}%`;

                    // Create notification for the lost item owner
                    await createNotification(lostItem.user_id, matchMessage, 'match');

                    console.log(`[Matching] 📢 Notification sent to user ${lostItem.owner_name} (ID: ${lostItem.user_id})`);
                }
            } catch (notifyErr) {
                console.error('[Matching] Error sending notification:', notifyErr.message);
            }

            console.log(`[Matching] Items #${newItem.id} and #${bestMatch.id} marked as 'matched'.`);
        } else {
            console.log(`[Matching] No sufficient match found (best score: ${bestScore.toFixed(4)}, threshold: ${THRESHOLD}).`);
        }

    } catch (err) {
        console.error('[Matching] Error during matching:', err.message);
    }
}

module.exports = { runMatching };
