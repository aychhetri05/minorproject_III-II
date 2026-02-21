# Physical Verification Workflow - API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except public item endpoints require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Public Item Endpoints (No Auth)

#### GET /items
Retrieve all items in the system.

**Request:**
```http
GET /api/items HTTP/1.1
Host: localhost:5000
```

**Response:**
```json
{
    "id": 10,
    "user_id": 5,
    "type": "found",
    "title": "Silver Wedding Ring",
    "description": "Found near Central Park",
    "image_path": "/uploads/1708500000-987654321.jpg",
    "status": "physically_verified",
    "physically_verified": true,
    "verification_type": "Physical",
    "verified_by": 15,
    "verification_timestamp": "2024-02-21T15:30:00Z",
    "police_notes": "Item verified. Serial #XYZ123.",
    "submission_timestamp": "2024-02-21T10:30:00Z",
    "created_at": "2024-02-21T08:00:00Z",
    "reporter_name": "John Doe",
    "verifier_name": "Officer Smith"
}
```

---

#### GET /items/:id
Get a single item with match information.

**Request:**
```http
GET /api/items/10 HTTP/1.1
Host: localhost:5000
```

**Response:**
```json
{
    "id": 10,
    "user_id": 5,
    "type": "found",
    "title": "Silver Wedding Ring",
    "description": "Found near Central Park",
    "image_path": "/uploads/1708500000-987654321.jpg",
    "status": "physically_verified",
    "physically_verified": true,
    "verification_type": "Physical",
    "verified_by": 15,
    "verification_timestamp": "2024-02-21T15:30:00Z",
    "police_notes": "Item verified. Serial #XYZ123.",
    "submission_timestamp": "2024-02-21T10:30:00Z",
    "created_at": "2024-02-21T08:00:00Z",
    "reporter_name": "John Doe",
    "reporter_email": "john@example.com",
    "verifier_name": "Officer Smith",
    "match": {
        "id": 42,
        "lost_item_id": 8,
        "found_item_id": 10,
        "similarity_score": 0.87,
        "verification_status": "pending",
        "created_at": "2024-02-21T09:00:00Z"
    }
}
```

---

#### GET /items/open
Get only open items (unmatched).

**Request:**
```http
GET /api/items/open HTTP/1.1
Host: localhost:5000
```

---

### 2. Found User Submission Endpoints

#### POST /items/:id/submit-physical
Create a physical submission request for a found item.

**Authentication:** Required (Bearer token)

**Request:**
```http
POST /api/items/10/submit-physical HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "police_station": "Downtown Police Station, Room 204",
    "location_details": "Ask for Officer Smith at front desk"
}
```

**Response (201):**
```json
{
    "message": "Submission created, pending police verification.",
    "submissionId": 42
}
```

**Error Responses:**

```json
// 403 - Item doesn't belong to user
{
    "message": "Only the reporting user can submit this item."
}
```

```json
// 400 - Item is not 'found' type
{
    "message": "Only found items can be submitted physically."
}
```

```json
// 404 - Item not found
{
    "message": "Item not found."
}
```

**Side Effects:**
- Creates record in `submissions` table
- Updates item status → `pending_physical`
- Sets `submission_timestamp`

---

### 3. Police/Admin Submission Management

#### GET /police/submissions
List all pending physical submissions.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
GET /api/police/submissions HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
    {
        "id": 42,
        "item_id": 10,
        "item_title": "Silver Wedding Ring",
        "found_user_id": 5,
        "found_user_name": "John Doe",
        "found_user_email": "john@example.com",
        "police_station": "Downtown Police Station, Room 204",
        "location_details": "Ask for Officer Smith",
        "status": "pending",
        "submission_timestamp": "2024-02-21T10:30:00Z"
    },
    {
        "id": 43,
        "item_id": 11,
        "item_title": "Blue Backpack",
        "found_user_id": 6,
        "found_user_name": "Jane Smith",
        "found_user_email": "jane@example.com",
        "police_station": "Northern Precinct Station",
        "location_details": "Locker 5B",
        "status": "pending",
        "submission_timestamp": "2024-02-21T11:00:00Z"
    }
]
```

---

#### POST /police/submissions/:id/accept
Accept and verify a physical submission.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/submissions/42/accept HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Item physically inspected and verified. Serial #XYZ123. Excellent condition."
}
```

**Response (200):**
```json
{
    "message": "Submission accepted and item physically verified."
}
```

**Side Effects:**
- Updates `submissions.status` → `accepted`
- Sets `submissions.processed_by` → current officer ID
- Sets `submissions.processed_at` → current timestamp
- Updates `items` table:
  - `physically_verified` → `TRUE`
  - `verification_type` → `'Physical'`
  - `verified_by` → Officer ID
  - `verification_timestamp` → Current timestamp
  - `police_notes` → Provided notes
  - `status` → `'physically_verified'`
- Creates audit log in `police_actions`
- Sends notification to found user

---

#### POST /police/submissions/:id/reject
Reject a physical submission.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/submissions/42/reject HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Item doesn't match description. Color is different from reported."
}
```

**Response (200):**
```json
{
    "message": "Submission rejected."
}
```

**Side Effects:**
- Updates `submissions.status` → `rejected`
- Updates `submissions.processed_by` → current officer ID
- Updates `submissions.processed_at` → current timestamp
- Reverts item `status` → `reported`
- Creates audit log in `police_actions`
- Sends notification to found user with rejection reason

---

### 4. Police Item Management Endpoints

#### GET /police/items
Get items for police review with optional filters.

**Authentication:** Required (Police or Admin role)

**Query Parameters:**
- `type` (optional): 'lost' or 'found'
- `status` (optional): item status
- `location` (optional): text search in title/description
- `startDate` (optional): ISO date format
- `endDate` (optional): ISO date format

**Request:**
```http
GET /api/police/items?type=found&status=pending_physical HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
    {
        "id": 10,
        "user_id": 5,
        "type": "found",
        "title": "Silver Wedding Ring",
        "status": "pending_physical",
        "physically_verified": false,
        "reporter_name": "John Doe",
        "reporter_email": "john@example.com",
        "match_id": null,
        "similarity_score": null
    }
]
```

---

#### GET /police/matches
Get all AI-matched item pairs.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
GET /api/police/matches HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
    {
        "id": 42,
        "lost_item_id": 8,
        "found_item_id": 10,
        "similarity_score": 0.87,
        "verification_status": "pending",
        "verified_by": null,
        "verification_timestamp": null,
        "police_notes": null,
        "created_at": "2024-02-21T09:00:00Z",
        "lost_title": "Gold Ring - Lost",
        "found_title": "Silver Wedding Ring",
        "lost_reporter": "Jane Smith",
        "found_reporter": "John Doe"
    }
]
```

---

#### POST /police/matches/:id/verify
Verify an AI match.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/matches/42/verify HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Items verified as matching pair. Physical inspection complete."
}
```

**Response (200):**
```json
{
    "message": "Match verified successfully."
}
```

---

#### POST /police/matches/:id/reject
Reject an AI match.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/matches/42/reject HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Items appear similar but don't match upon inspection."
}
```

**Response (200):**
```json
{
    "message": "Match rejected and items reopened."
}
```

---

### 5. Police Item Status Management

#### POST /police/items/:id/store
Mark an item as stored in police custody.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/items/10/store HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Item stored in locker B5. Storage fee: $10."
}
```

**Response (200):**
```json
{
    "message": "Item marked as stored in police station."
}
```

---

#### POST /police/items/:id/close
Mark an item as closed/resolved.

**Authentication:** Required (Police or Admin role)

**Request:**
```http
POST /api/police/items/10/close HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "notes": "Item handed over to owner on 2024-02-21. ID verified."
}
```

**Response (200):**
```json
{
    "message": "Item marked closed/resolved by police."
}
```

**Side Effects:**
- Updates `items.status` → `'resolved'`
- Updates `items.storage_status` → `'closed'`
- Creates audit log

---

### 6. Admin Endpoints

#### POST /admin/create-police
Create a new police officer account.

**Authentication:** Required (Admin role only)

**Request:**
```http
POST /api/admin/create-police HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "name": "Officer John Smith",
    "email": "john.smith@police.gov",
    "password": "SecurePassword123"  // optional
}
```

**Response (201):**
```json
{
    "message": "Police account created.",
    "userId": 15,
    "tempPassword": "AbC123xYz"  // only if password not provided
}
```

---

#### GET /admin/stats
Get system statistics.

**Authentication:** Required (Admin role only)

**Request:**
```http
GET /api/admin/stats HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
    "total": 156,
    "lost": 62,
    "found": 94,
    "open": 38,
    "matched": 18,
    "resolved": 42,
    "users": 125,
    "totalMatches": 18
}
```

---

#### GET /admin/matches
Get all AI matches for admin review.

**Authentication:** Required (Admin role only)

**Request:**
```http
GET /api/admin/matches HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** (Same as `/police/matches`)

---

## Error Responses

All error responses follow this format:

```json
{
    "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 500 | Server Error |

---

## Request/Response Examples

### Example 1: Complete Submission Workflow

**Step 1: Found user submits item**
```bash
curl -X POST http://localhost:5000/api/items/10/submit-physical \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "police_station": "Downtown Police Station, Room 204",
    "location_details": "Ask for Officer Smith"
  }'
```

**Response:**
```json
{
    "message": "Submission created, pending police verification.",
    "submissionId": 42
}
```

**Step 2: Police officer retrieves submissions**
```bash
curl -X GET http://localhost:5000/api/police/submissions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Step 3: Police officer accepts submission**
```bash
curl -X POST http://localhost:5000/api/police/submissions/42/accept \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Item verified. Serial #XYZ123."
  }'
```

---

## Frontend API Service Usage

The frontend API service (`frontend/src/services/api.js`) provides wrapper methods:

```javascript
// Submit item to police
submitPhysical(itemId, data)

// Get pending submissions
getPoliceSubmissions()

// Accept submission
acceptSubmission(submissionId, data)

// Reject submission
rejectSubmission(submissionId, data)

// Get police items
getPoliceItems(filters)

// Get police matches
getPoliceMatches()

// Verify match
verifyMatch(matchId, data)

// Reject match
rejectMatch(matchId, data)

// Mark item stored
markItemStored(itemId, data)

// Mark item closed
markItemClosed(itemId, data)
```

**Example Usage:**
```javascript
import { acceptSubmission, getPoliceSubmissions } from '../services/api';

// Get submissions
const response = await getPoliceSubmissions();
const submissions = response.data;

// Accept a submission
await acceptSubmission(42, { notes: 'Verified' });
```

---

## Rate Limiting

No rate limiting is currently implemented. For production deployment, consider:
- Limit submissions per user per day
- Limit API calls per minute
- Implement request throttling

---

## Pagination

Currently not implemented. For large datasets, consider adding:
```
GET /api/police/submissions?page=1&limit=20
Response: { data: [...], total: 156, page: 1, pages: 8 }
```

---

**Version:** 1.0  
**Last Updated:** February 21, 2026  
**Status:** Production Ready
