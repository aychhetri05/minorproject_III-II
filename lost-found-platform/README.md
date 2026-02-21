# 🇳🇵 Centralized Lost and Recovery Platform
### With Nepal Police Integration — Academic Prototype (Mid-Defense)

---

## 📁 Project Structure

```
lost-found-platform/
├── database/
│   └── schema.sql              ← MySQL database schema
│
├── backend/
│   ├── server.js               ← Express entry point
│   ├── .env.example            ← Environment config template
│   ├── package.json
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             ← JWT + admin middleware
│   ├── controllers/
│   │   ├── authController.js   ← Register / Login logic
│   │   └── itemController.js   ← CRUD + admin routes
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── itemRoutes.js
│   ├── services/
│   │   └── matchingService.js  ← 🤖 AI NLP Matching Engine
│   └── uploads/                ← Uploaded images stored here
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.js              ← Router + layout
        ├── index.js
        ├── services/
        │   └── api.js          ← All Axios API calls
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ItemCard.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Home.jsx
            ├── Register.jsx
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── ReportItem.jsx
            ├── ViewItems.jsx
            ├── ItemDetail.jsx
            └── AdminPanel.jsx
```

---

## ⚙️ Prerequisites

- Node.js v18+
- MySQL 8.0+
- npm or yarn

---

## 🗄️ Step 1: Database Setup

Open MySQL and run:

```sql
-- Run the full schema
SOURCE /path/to/lost-found-platform/database/schema.sql;
```

Or paste the contents of `database/schema.sql` into MySQL Workbench / DBeaver.

This creates:
- `lost_found_db` database
- `users` table (with a default admin account)
- `items` table
- `matches` table

**Default Admin Credentials:**
```
Email:    admin@nepalpolice.gov.np
Password: password
```
> ⚠️ Change this in production!

---

## 🖥️ Step 2: Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create your .env file from template
cp .env.example .env

# 3. Edit .env with your MySQL credentials
nano .env
```

### `.env` Configuration:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourMySQLpassword
DB_NAME=lost_found_db
JWT_SECRET=any_long_random_string_here
MATCH_THRESHOLD=0.3
```

> `MATCH_THRESHOLD` controls AI matching sensitivity (0-1). Lower = more matches.

```bash
# 4. Start the backend
npm start

# Or for development with auto-reload:
npm run dev
```

Backend runs at: **http://localhost:5000**

---

## 🌐 Step 3: Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start the React app
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔌 API Endpoints Reference

### Authentication (Public)
| Method | Endpoint        | Description           |
|--------|-----------------|-----------------------|
| POST   | /api/register   | Create new user       |
| POST   | /api/login      | Login, returns JWT    |

### Items (Mixed Auth)
| Method | Endpoint              | Auth      | Description              |
|--------|-----------------------|-----------|--------------------------|
| GET    | /api/items            | Public    | Get all items            |
| GET    | /api/items/open       | Public    | Get open items only      |
| GET    | /api/items/:id        | Public    | Get single item + match  |
| POST   | /api/items            | User JWT  | Report new item + AI run |

### Admin Only
| Method | Endpoint              | Auth      | Description              |
|--------|-----------------------|-----------|--------------------------|
| GET    | /api/admin/stats      | Admin JWT | Platform statistics      |
| GET    | /api/admin/matches    | Admin JWT | All AI match records     |
| PATCH  | /api/items/:id/status | Admin JWT | Change item status       |

---

## 🤖 How AI Matching Works

Located in: `backend/services/matchingService.js`

### Algorithm Flow:

```
New Item Submitted
       │
       ▼
Determine opposite type
(lost → search found | found → search lost)
       │
       ▼
Fetch all "open" items of opposite type from DB
       │
       ▼
For each candidate:
  1. Concatenate title + description
  2. Tokenize text (split into words)
  3. Stem each token (Porter Stemmer)
     e.g. "walking" → "walk", "wallets" → "wallet"
  4. Build Term Frequency (TF) vector
  5. Calculate Cosine Similarity between new item and candidate
       │
       ▼
Best matching score > MATCH_THRESHOLD (default: 0.3)?
       │
    YES → Insert into matches table
          Update both items status = 'matched'
       │
    NO  → No action, item stays 'open'
```

### Example:
- **Lost item:** "Blue leather wallet lost near Thamel, has ID cards inside"
- **Found item:** "Found a wallet near Thamel area, blue color, leather, has some cards"
- **Result:** High cosine similarity → ✅ MATCHED

---

## 👤 User Roles

| Feature              | Normal User | Admin (Police) |
|----------------------|-------------|----------------|
| Register / Login     | ✅           | ✅              |
| Report Lost/Found    | ✅           | ✅              |
| View All Items       | ✅           | ✅              |
| View Match Status    | ✅           | ✅              |
| View AI Match Report | ❌           | ✅              |
| Change Item Status   | ❌           | ✅              |
| View Platform Stats  | ❌           | ✅              |

---

## 🧪 Testing the System

### Quick Test Flow:

1. Register two accounts (User A and User B)
2. Login as User A → Report a **lost** item:
   - Title: "Blue leather wallet"
   - Description: "Lost my blue leather wallet near Thamel area, contains ID and cards"
3. Login as User B → Report a **found** item:
   - Title: "Found wallet near Thamel"
   - Description: "Found a blue leather wallet near Thamel, has cards and documents inside"
4. Check the console logs — you should see matching output
5. Go to `/items` and check both items now show status: **matched**
6. Login as Admin → Go to `/admin` → View **AI Matches** tab

---

## 📦 Dependencies Summary

### Backend
| Package    | Purpose                        |
|------------|--------------------------------|
| express    | Web framework                  |
| mysql2     | MySQL driver with promises     |
| bcrypt     | Password hashing               |
| jsonwebtoken | JWT generation & verification |
| multer     | Image upload handling          |
| cors       | Cross-origin requests          |
| natural    | NLP: tokenization, stemming    |
| dotenv     | Environment variable loading   |

### Frontend
| Package         | Purpose                   |
|-----------------|---------------------------|
| react           | UI framework              |
| react-router-dom| Client-side routing       |
| axios           | HTTP requests to backend  |
| bootstrap       | CSS styling framework     |

---

## 🔐 Security Notes (Academic Prototype)

- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- Admin role cannot be self-assigned during registration
- File uploads are limited to images (5MB max)
- Users cannot access admin endpoints

---

## 🎓 Academic Notes

This project demonstrates:
- **Full-stack development** (React + Node.js + MySQL)
- **RESTful API design** with proper HTTP methods
- **Authentication & Authorization** (JWT + Role-based)
- **Natural Language Processing** (Tokenization, Stemming, Cosine Similarity)
- **File handling** (Multer for simulated off-chain image storage)
- **Clean architecture** (MVC pattern with service layer)
