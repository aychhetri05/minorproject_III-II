# Physical Verification Workflow - Implementation Guide

## Quick Start

### 1. Database Setup ✓
The database schema is already complete with all necessary tables and columns:
- `submissions` table for submission tracking
- `police_actions` table for audit logging
- Enhanced `items` table with verification columns

**No additional migrations needed** - schema is ready!

### 2. Backend Routes ✓
All backend routes are implemented and secured:

```
GET  /api/police/submissions              → List pending submissions
POST /api/police/submissions/:id/accept   → Accept & verify item
POST /api/police/submissions/:id/reject   → Reject submission
POST /api/items/:id/submit-physical       → Create submission (found user)
```

**Security:** Routes protected by `policeOrAdminMiddleware` (both police & admin roles)

### 3. Frontend Components ✓

#### a. SubmitToPoliceButton Component
**File:** `frontend/src/components/SubmitToPoliceButton.jsx`
- Modal form for submission details
- Input validation
- Error handling
- Loading states

**Usage:**
```jsx
import SubmitToPoliceButton from '../components/SubmitToPoliceButton';

<SubmitToPoliceButton 
    itemId={item.id}
    itemStatus={item.status}
    onSubmitted={() => window.location.reload()}
/>
```

#### b. VerificationBadge Component
**File:** `frontend/src/components/VerificationBadge.jsx`
- Displays verification details
- Shows officer name, timestamp, notes
- Two display modes: compact & full

**Usage:**
```jsx
import VerificationBadge from '../components/VerificationBadge';

// Compact badge
<VerificationBadge item={item} compact={true} />

// Full details
<VerificationBadge item={item} compact={false} />
```

#### c. Enhanced ItemCard
**File:** `frontend/src/components/ItemCard.jsx`
- Updated status colors for new statuses
- Status icons for visual clarity
- Automatic badge display for verified items

#### d. Enhanced ItemDetail
**File:** `frontend/src/pages/ItemDetail.jsx`
- Physical verification information section
- Submit button for found users
- Verification details display
- Timeline information

#### e. Enhanced PoliceDashboard
**File:** `frontend/src/pages/PoliceDashboard.jsx`
- Three tabbed sections
- Summary statistics cards
- Submission cards with action buttons
- Filterable item table

## Feature Workflows

### Workflow 1: Found User Submits Item

```
1. User logs in & Views own found item
   ↓
2. Clicks "Submit to Police" button
   ↓
3. Modal appears with form:
   - Police Station/Location (required)
   - Location Details (optional)
   ↓
4. User fills form & clicks "Submit"
   ↓
5. POST /api/items/:id/submit-physical
   {
       "police_station": "Downtown Police Station, Room 204",
       "location_details": "Ask for Officer Smith, Desk 5"
   }
   ↓
6. Backend:
   - Validates user owns item & item is 'found' type
   - Creates submission record
   - Updates item status → "pending_physical"
   - Sets submission_timestamp
   ↓
7. User sees: Status changed to "Pending Physical (⏳)"
```

### Workflow 2: Police Officer Verifies Item

```
1. Officer logs in to PoliceDashboard
   ↓
2. Clicks "Pending Physical Submissions" tab
   ↓
3. Reviews submission card:
   - Item title
   - Submitter name & email
   - Police station location
   - Location details
   ↓
4. Officer inspects physical item at station
   ↓
5. Clicks "Accept & Verify" button
   ↓
6. Modal appears for optional verification notes
   {
       "notes": "Item inspected and verified. Serial #XYZ123. Good condition."
   }
   ↓
7. POST /api/police/submissions/:id/accept
   ↓
8. Backend:
   - Updates submission status → "accepted"
   - Sets verified_by = officer_id
   - Updates item fields:
     * physically_verified = TRUE
     * verification_type = 'Physical'
     * verified_by = officer_id
     * verification_timestamp = NOW()
     * police_notes = notes
     * status = 'physically_verified'
   - Creates police_actions audit log
   - Sends notification to found user
   ↓
9. Found user sees:
   - Notification: "Item verified! ✔"
   - Item displays: Status "Physically Verified (🚔)"
   - Item displays badge: "✔ Verified by Police"
   - Shows officer name & verification details
```

### Workflow 3: Police Officer Rejects Submission

```
1. Officer reviews submission & finds issues
   ↓
2. Clicks "Reject" button
   ↓
3. Modal prompts for rejection reason
   {
       "notes": "Item doesn't match provided description. Shape is different."
   }
   ↓
4. POST /api/police/submissions/:id/reject
   ↓
5. Backend:
   - Updates submission status → "rejected"
   - Reverts item status → "reported"
   - Creates police_actions audit log
   - Sends notification with rejection reason
   ↓
6. Found user sees:
   - Notification with rejection reason
   - Item status back to "Reported"
   - Can resubmit if needed
```

## Code Examples

### Example 1: Creating a Submission

**Frontend Request:**
```javascript
// In SubmitToPoliceButton.jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
        police_station: formData.police_station,
        location_details: formData.location_details
    };
    
    try {
        const response = await submitPhysical(itemId, data);
        alert('Submission created successfully!');
    } catch (error) {
        alert('Error: ' + error.response.data.message);
    }
};
```

**Backend Handler (`itemController.js`):**
```javascript
const submitPhysical = async (req, res) => {
    const itemId = req.params.id;
    const userId = req.user.id;
    const { police_station, location_details } = req.body;

    try {
        // Validate item exists and belongs to user
        const [items] = await db.query(
            'SELECT * FROM items WHERE id = ? AND user_id = ? AND type = ?',
            [itemId, userId, 'found']
        );
        if (items.length === 0) {
            return res.status(404).json({ 
                message: 'Item not found or not owned by user.' 
            });
        }

        // Create submission
        const [result] = await db.query(
            'INSERT INTO submissions (item_id, found_user_id, police_station, location_details) ' +
            'VALUES (?, ?, ?, ?)',
            [itemId, userId, police_station || null, location_details || null]
        );

        // Update item status
        await db.query(
            'UPDATE items SET status = ?, submission_timestamp = NOW() WHERE id = ?',
            ['pending_physical', itemId]
        );

        res.status(201).json({
            message: 'Submission created',
            submissionId: result.insertId
        });
    } catch (err) {
        console.error('[SubmitPhysical]', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
```

### Example 2: Accepting a Submission

**Frontend Request:**
```javascript
// In PoliceDashboard.jsx
const handleAcceptSubmission = async (subId) => {
    const notes = prompt('Verification notes:');
    if (notes === null) return; // User cancelled
    
    try {
        await acceptSubmission(subId, { notes });
        alert('✔ Item verified successfully!');
        loadSubmissions(); // Refresh list
    } catch (error) {
        alert('Error: ' + error.response.data.message);
    }
};
```

**Backend Handler (`policeController.js`):**
```javascript
const acceptSubmission = async (req, res) => {
    const subId = req.params.id;
    const policeId = req.user.id;
    const { notes } = req.body;

    try {
        // Get submission details
        const [[sub]] = await db.query(
            'SELECT * FROM submissions WHERE id = ?',
            [subId]
        );
        
        if (!sub) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Mark submission as accepted
        await db.query(
            'UPDATE submissions SET status = ?, processed_by = ?, processed_at = NOW(), notes = ? WHERE id = ?',
            ['accepted', policeId, notes || null, subId]
        );

        // Update item with verification details
        await db.query(
            'UPDATE items SET physically_verified = TRUE, verification_type = ?, ' +
            'verified_by = ?, verification_timestamp = NOW(), ' +
            'police_notes = ?, status = ? WHERE id = ?',
            ['Physical', policeId, notes || null, 'physically_verified', sub.item_id]
        );

        // Create audit log
        await db.query(
            'INSERT INTO police_actions (police_id, action_type, item_id, notes) ' +
            'VALUES (?, ?, ?, ?)',
            [policeId, 'accept_submission', sub.item_id, notes || null]
        );

        // Notify found user
        const msgFound = `Your physical submission for item #${sub.item_id} was accepted!`;
        await createNotification(sub.found_user_id, msgFound);

        res.json({ message: 'Item verified successfully' });
    } catch (err) {
        console.error('[AcceptSubmission]', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
```

### Example 3: Displaying Verification Badge

**In ItemDetail.jsx:**
```jsx
import VerificationBadge from '../components/VerificationBadge';

// In render:
{item.physically_verified ? (
    <VerificationBadge item={item} compact={false} />
) : item.status === 'pending_physical' ? (
    <div className="alert alert-warning">
        <small>⏳ Waiting for police verification...</small>
    </div>
) : null}
```

**In ItemCard.jsx:**
```jsx
import VerificationBadge from './VerificationBadge';

// In render:
{item.physically_verified && (
    <VerificationBadge item={item} compact={true} />
)}
```

## Security Implementation

### 1. Role-Based Access Control

**Middleware Chain:**
```javascript
// In server.js
app.use('/api/police', 
    authMiddleware,              // Verify JWT token
    policeOrAdminMiddleware,     // Require police OR admin role
    policeRoutes                 // Route handlers
);
```

**Middleware Code (`auth.js`):**
```javascript
const policeOrAdminMiddleware = (req, res, next) => {
    if (!req.user || !['police', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'Police or Admin access required.' 
        });
    }
    next();
};
```

### 2. Frontend Authorization

**In React Components:**
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check if user can submit item
const canSubmit = item.type === 'found' && 
                  user.id === item.user_id &&
                  ['reported', 'pending_physical'].includes(item.status);

// Display button only if authorized
{canSubmit && <SubmitToPoliceButton itemId={item.id} />}
```

### 3. Audit Logging

Every police action is logged:
```javascript
// Police actions are automatically logged
await db.query(
    'INSERT INTO police_actions (police_id, action_type, item_id, notes) ' +
    'VALUES (?, ?, ?, ?)',
    [policeId, 'accept_submission', itemId, notes]
);

// Query audit log
SELECT * FROM police_actions 
WHERE action_type IN ('accept_submission', 'reject_submission')
ORDER BY created_at DESC;
```

## Testing Checklist

### Manual Testing

- [ ] Create account as regular user
- [ ] Report a found item
- [ ] View item detail page
- [ ] See "Submit to Police" button
- [ ] Click button and fill submission form
- [ ] Verify status changes to "pending_physical"
- [ ] Login as police officer
- [ ] Go to PoliceDashboard
- [ ] See pending submission in tab
- [ ] Click "Accept & Verify"
- [ ] Enter verification notes
- [ ] Verify item status changes to "physically_verified"
- [ ] See badge "✔ Verified by Police" appears
- [ ] Check notification sent to user
- [ ] Verify audit log created

### API Testing (cURL)

```bash
# Create submission
curl -X POST http://localhost:5000/api/items/10/submit-physical \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "police_station": "Downtown Station",
    "location_details": "Room 204"
  }'

# Get pending submissions
curl -X GET http://localhost:5000/api/police/submissions \
  -H "Authorization: Bearer <police-token>"

# Accept submission
curl -X POST http://localhost:5000/api/police/submissions/42/accept \
  -H "Authorization: Bearer <police-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Item verified. Serial #XYZ123."
  }'
```

## Deployment Checklist

- [ ] Database migrations applied (schema already complete)
- [ ] Backend environment variables configured
- [ ] Frontend API_URL correctly set
- [ ] Police/Admin users created in database
- [ ] Notification service configured
- [ ] SSL/HTTPS enabled
- [ ] CORS properly configured
- [ ] Error logging in place
- [ ] Monitoring alerts set up
- [ ] Backup strategy established

## Performance Optimization

### Database Indexes
```sql
-- Add indexes for common queries
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_item_id ON submissions(item_id);
CREATE INDEX idx_items_physically_verified ON items(physically_verified);
CREATE INDEX idx_police_actions_police_id ON police_actions(police_id);
```

### Query Optimization
```javascript
// Use LEFT JOIN to get verification details in one query
SELECT i.*, v.name AS verifier_name 
FROM items i
LEFT JOIN users v ON i.verified_by = v.id
WHERE i.id = ?;
```

### Frontend Caching
```javascript
// Cache submission list in PoliceDashboard
const [submissionCache, setSubmissionCache] = useState(Date.now());
const [refreshing, setRefreshing] = useState(false);

// Only auto-refresh every 10 seconds
useEffect(() => {
    const interval = setInterval(() => {
        loadSubmissions();
    }, 10000);
    return () => clearInterval(interval);
}, []);
```

## Troubleshooting

### Issue: "Police or Admin access required"
**Solution:** Ensure user has police or admin role in database
```sql
SELECT role FROM users WHERE id = ?;
UPDATE users SET role = 'police' WHERE id = ?;
```

### Issue: Submission button not appearing
**Solution:** Check item status and ownership
```javascript
// Debug in browser console
const item = await getItemById(itemId);
console.log('Item type:', item.data.type);
console.log('Item status:', item.data.status);
console.log('User ID:', JSON.parse(localStorage.getItem('user')).id);
console.log('Item user ID:', item.data.user_id);
```

### Issue: Verification badge not displaying after accept
**Solution:** Page needs refresh to fetch updated data
```javascript
// In handleAcceptSubmission callback
await acceptSubmission(subId, { notes });
window.location.reload(); // Refresh entire page
// Or use more sophisticated state update:
setItems(items.map(i => i.id === itemId ? {...i, physically_verified: true} : i));
```

## Documentation Files

1. **PHYSICAL_VERIFICATION_GUIDE.md** - Complete feature guide
2. **IMPLEMENTATION_GUIDE.md** - This file, with code examples
3. **API_DOCUMENTATION.md** (optional) - Detailed API reference

## Support

For issues or questions:
1. Check this implementation guide
2. Review error logs in backend console
3. Check browser console for frontend errors
4. Review database logs for SQL errors
5. Check notifications table for message details

---

**Version:** 1.0  
**Updated:** February 21, 2026  
**Status:** Ready for Production
