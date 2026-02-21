# Quick Reference - Physical Verification Workflow

## Status Values

| Status | Icon | Color | Meaning | Next Status |
|--------|------|-------|---------|-------------|
| `open` | 🔄 | Green | Item is open and available | matched |
| `reported` | 📝 | Blue | Item has been reported | pending_physical |
| `matched` | 🔗 | Yellow | AI found potential match | verified |
| `verified` | ✅ | Dark Blue | Match verified by police | resolved |
| `pending_physical` | ⏳ | Yellow | Awaiting physical verification by police | physically_verified or reported |
| `physically_verified` | 🚔 | Green | Item physically verified by police | resolved |
| `resolved` | 🎉 | Gray | Case closed/item handed over | - |

## Status Badges

| Type | Badge | Location |
|------|-------|----------|
| Type | `[LOST]` or `[FOUND]` | Item card top-left |
| Status | Status with icon | Item card top-right |
| Verified | "✔ Verified by Police" | Item card, below status |
| Verification Details | Full card with officer info | Item detail page |

## API Endpoints Quick Guide

### For Users
```
POST /api/items/:id/submit-physical
  → Create submission request
```

### For Police/Admin
```
GET  /api/police/submissions
  → List pending submissions
  
POST /api/police/submissions/:id/accept
  → Accept & verify item
  
POST /api/police/submissions/:id/reject
  → Reject submission
  
GET  /api/police/items
  → List items with filters
  
GET  /api/police/matches
  → List AI matches
```

## Component Props

### SubmitToPoliceButton
```jsx
<SubmitToPoliceButton 
  itemId={10}
  itemStatus="reported"
  onSubmitted={callback}
/>
```

### VerificationBadge
```jsx
<VerificationBadge 
  item={itemData}
  compact={true}  // or false for full details
/>
```

## Database Fields

### Items Table (Enhanced)
```sql
physically_verified BOOLEAN    -- Has item been physically verified?
verification_type VARCHAR(50)  -- 'Physical' or 'AI'
verified_by INT               -- Officer ID who verified
verification_timestamp TIMESTAMP -- When verified
police_notes TEXT             -- Officer's notes
submission_timestamp TIMESTAMP -- When submitted
```

### Submissions Table
```sql
id INT                -- Submission ID
item_id INT          -- Which item
found_user_id INT    -- Who submitted
police_station VARCHAR(255) -- Where submitted
location_details TEXT     -- Additional location info
status ENUM('pending','accepted','rejected')
submission_timestamp TIMESTAMP
processed_by INT     -- Which officer processed
processed_at TIMESTAMP
notes TEXT
```

## Verification Flow Diagram

```
FOUND USER FLOW:
═══════════════

1. Report Found Item
   ↓ (status: reported)
   
2. Click "Submit to Police"
   ↓ (status: pending_physical)
   ↓ New submission created
   
3. Wait for Police Verification
   ↓
   
4a. ACCEPTED: Item marked as physically_verified
    ↓ Badge appears: ✔ Verified by Police
    ↓ Notification sent to user
    ↓ (status: physically_verified)
    
4b. REJECTED: Status reverts to reported
    ↓ Can resubmit
    ↓ Notification with rejection reason


POLICE OFFICER FLOW:
════════════════════

1. Login to Dashboard
   
2. Click "Pending Physical Submissions" tab
   ↓ See list of pending submissions
   
3. Review submission details
   ↓ Item info
   ↓ Submitter contact
   ↓ Location
   
4. Receive/Inspect physical item
   ↓
   
5a. Accept & Verify
    → Click "Accept & Verify"
    → Enter verification notes (optional)
    → Submit
    → Item marked as physically_verified
    → Notification sent to user
    
5b. Reject
    → Click "Reject"
    → Enter rejection reason
    → Submit
    → Status reverts to reported
    → Notification sent to user
```

## Key Features Checklist

### Fraud Prevention
- [x] Physical verification required
- [x] Police/admin verification only
- [x] Audit trail for accountability
- [x] Verification timestamp recorded
- [x] Officer details documented
- [x] Notes field for specifics

### User Experience
- [x] Simple submission process
- [x] Modal form interface
- [x] Clear status display
- [x] Verification badge
- [x] Officer details visible
- [x] Notifications for updates

### Police Features
- [x] Pending submissions list
- [x] Item management dashboard
- [x] Match verification
- [x] Storage tracking
- [x] Audit logging
- [x] Filters and search

## Security Checklist

- [x] JWT authentication required
- [x] Role-based access control
- [x] Police/Admin roles validated
- [x] Item ownership validated
- [x] SQL injection prevention
- [x] CORS properly configured
- [x] Audit logging enabled
- [x] Input validation enabled

## Testing Scenarios

### Scenario 1: Happy Path
1. User reports found item ✓
2. User submits to police ✓
3. Police accepts ✓
4. Item shows verified badge ✓

### Scenario 2: Rejection Path
1. User reports found item ✓
2. User submits to police ✓
3. Police rejects (mismatch) ✓
4. User notified with reason ✓
5. User can resubmit ✓

### Scenario 3: AI Match Path
1. Found item reported ✓
2. AI finds match ✓
3. Police verifies match ✓
4. Both items marked verified ✓

## Common API Responses

### Success Response
```json
{
    "message": "Success message here",
    "submissionId": 42  // or other relevant ID
}
```

### Error Response
```json
{
    "message": "Error description"
}
```

### List Response
```json
{
    "data": [
        { /* item 1 */ },
        { /* item 2 */ }
    ]
}
```

## File Locations Reference

**Backend:**
- Middleware: `backend/middleware/auth.js`
- Controllers: `backend/controllers/{itemController,policeController}.js`
- Routes: `backend/routes/{itemRoutes,policeRoutes}.js`
- Server: `backend/server.js`

**Frontend:**
- Components: `frontend/src/components/{SubmitToPoliceButton,VerificationBadge,ItemCard}.jsx`
- Pages: `frontend/src/pages/{ItemDetail,PoliceDashboard}.jsx`
- Services: `frontend/src/services/api.js`

**Documentation:**
- Guide: `PHYSICAL_VERIFICATION_GUIDE.md`
- Implementation: `IMPLEMENTATION_GUIDE.md`
- API Reference: `API_REFERENCE.md`
- This file: `QUICK_REFERENCE.md`

## Troubleshooting Flowchart

```
Issue: Submission button not showing
├─ Is user authenticated? → Login
├─ Is item type 'found'? → Report as found item
└─ Is item status 'reported'? → Wait for status update

Issue: Police dashboard shows no submissions
├─ Is user police role? → Ask admin to set role
├─ Are there pending submissions? → Check database
└─ Try refreshing page → Clear cache

Issue: Verification badge not appearing
├─ Is physically_verified = TRUE? → Check database
├─ Clear browser cache → Reload page
└─ Check API response → Verify all fields present

Issue: Notification not received
├─ Check notifications table → See if record created
├─ Check user inbox → Look for notification
└─ Check backend logs → See error messages
```

## Performance Tips

### Frontend
- Cache submission list with 10-second refresh
- Lazy load images on item detail pages
- Minimize re-renders using React.memo
- Use debouncing for filter searches

### Backend
- Add indexes: `submissions(status)`, `items(physically_verified)`
- Archive old submissions after 90 days
- Optimize police_actions queries with proper indexing
- Cache stats for admin dashboard

### Database
- Regular backups before/after verification actions
- Monitor submissions table growth
- Clean up old audit logs periodically
- Monitor query performance

## Compliance Notes

- ✓ Audit trail maintained for all actions
- ✓ Officer identification recorded
- ✓ Timestamps accurate for legal purposes
- ✓ User privacy maintained
- ✓ GDPR compliant data handling
- ✓ Data retention policies respected

## Future Enhancement Ideas

1. Photo verification during inspection
2. QR code generation for verified items
3. SMS notifications to users
4. Location-based submission suggestions
5. Verification analytics dashboard
6. Multi-stage approval workflow
7. Condition assessment checklist
8. Chain of custody documentation

---

**Last Updated:** February 21, 2026  
**Version:** 1.0  
**Status:** Production Ready
