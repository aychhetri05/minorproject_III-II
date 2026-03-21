# Forgot Password Feature Implementation Guide

## Overview
This document describes the complete "Forgot Password" feature added to the Lost & Found Platform. The feature allows users to securely reset their password via email verification token.

---

## Architecture & Security

### Key Security Features
- **JWT-based Reset Tokens**: Short-lived tokens (15 minutes) using JWT
- **Password Hashing**: Bcrypt for password hashing (SALT_ROUNDS: 10)
- **Token Expiry**: Reset links expire after 15 minutes
- **Database Security**: Reset token cleared after successful password reset
- **Email Privacy**: System doesn't reveal if email exists (prevents user enumeration)

---

## Database Changes

### Migration File
**Location**: `database/migration-add-reset-token.sql`

**Changes**:
```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_reset_token ON users(reset_token);
```

**User Table Structure** (after migration):
```
id, name, email, password, role, created_at
↓↓↓ NEW FIELDS ↓↓↓
reset_token, reset_token_expiry
```

---

## Backend Implementation

### 1. Updated Files

#### File: `backend/controllers/authController.js`

**New Function 1: `forgotPassword`**
```javascript
POST /api/auth/forgot-password
Request:  { email: "user@example.com" }
Response: { 
    message: "If account exists, reset link sent...",
    resetLink: "http://localhost:3000/reset-password/{token}" // Dev only
}
```

**What it does**:
1. Validates email input
2. Finds user by email
3. Generates JWT reset token (expires in 15 min)
4. Saves token & expiry to database
5. Logs reset link to console (ready for email integration)
6. Returns generic success message (doesn't reveal if email exists)

**Security Note**: Uses generic response for both existing and non-existing emails to prevent user enumeration attacks.

---

**New Function 2: `resetPassword`**
```javascript
POST /api/auth/reset-password/:token
Request:  {
    newPassword: "newPassword123",
    confirmPassword: "newPassword123"
}
Response: { message: "Password reset successfully..." }
```

**What it does**:
1. Validates token parameter
2. Verifies JWT token validity
3. Checks token hasn't expired
4. Validates password match
5. Validates password length (min 6 characters)
6. Hashes new password with bcrypt
7. Updates user's password in database
8. Clears reset_token and reset_token_expiry fields
9. Returns success message

**Error Handling**:
- Invalid/expired tokens → 401 Unauthorized
- Non-matching passwords → 400 Bad Request
- Weak passwords → 400 Bad Request

---

#### File: `backend/routes/authRoutes.js`

**New Routes**:
```javascript
// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);
```

---

### 2. Backend Dependencies
All required dependencies already exist:
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation & verification
- `dotenv` - Environment variables

---

## Frontend Implementation

### 1. Updated Files

#### File: `frontend/src/services/api.js`

**New API Methods**:
```javascript
// Add to Auth section
export const forgotPassword = (data) => 
    api.post('/auth/forgot-password', data);

export const resetPassword = (token, data) => 
    api.post(`/auth/reset-password/${token}`, data);
```

---

#### File: `frontend/src/pages/Login.jsx`

**Changes**: Added "Forgot Password?" link in password field
```jsx
<div className="d-flex justify-content-between align-items-center">
    <label className="form-label fw-semibold">Password</label>
    <Link to="/forgot-password" className="text-decoration-none small">
        Forgot Password?
    </Link>
</div>
```

---

#### File: `frontend/src/App.js`

**New Imports**:
```javascript
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
```

**New Routes** (Public, no authentication required):
```javascript
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
```

---

### 2. New UI Components

#### File: `frontend/src/pages/ForgotPassword.jsx`

**Purpose**: Allow users to request password reset

**Features**:
- Email input field
- "Send Reset Link" button
- Error/success messages
- Loading state
- Back to Login link
- Generic success message (doesn't reveal if email exists)

**User Flow**:
1. User enters email
2. Clicks "Send Reset Link"
3. System sends reset link via email (console log in dev)
4. User gets success message (whether email exists or not)
5. Link in email redirects to `/reset-password/:token`

---

#### File: `frontend/src/pages/ResetPassword.jsx`

**Purpose**: Allow users to set new password using reset token

**Features**:
- New Password input field
- Confirm Password input field
- Password validation (min 6 chars)
- Match validation
- "Reset Password" button
- Error/success messages
- Loading state
- Auto-redirect to Login on success

**User Flow**:
1. User clicks reset link from email
2. URL loads with token: `/reset-password/{token}`
3. User enters new password & confirmation
4. Validates password requirements
5. Submits reset request
6. On success: Shows success message, auto-redirects to Login after 2 seconds
7. On error: Shows specific error message

---

## User Journey

### Complete Flow
```
1. USER ON LOGIN PAGE
   ↓
2. Clicks "Forgot Password?" link
   ↓
3. FORGOT PASSWORD PAGE (/forgot-password)
   - Enters email
   - Clicks "Send Reset Link"
   ↓
4. BACKEND PROCESSING
   - Generates JWT token
   - Saves token to database
   - Logs link to console
   ↓
5. USER RECEIVES RESET LINK (console log in dev)
   - Link format: http://localhost:3000/reset-password/{token}
   ↓
6. USER CLICKS LINK
   ↓
7. RESET PASSWORD PAGE (/reset-password/:token)
   - Enters new password
   - Confirms password
   - Clicks "Reset Password"
   ↓
8. BACKEND PROCESSING
   - Verifies token & expiry
   - Validates password match
   - Hashes new password
   - Updates database
   - Clears reset token
   ↓
9. USER AUTO-REDIRECTED TO LOGIN
   - Can now login with new password
```

---

## Testing Guide

### 1. Manual Testing (Development)

**Step 1: Database Setup**
```sql
-- Run migration
mysql -u root -p < database/migration-add-reset-token.sql
```

**Step 2: Start servers**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

**Step 3: Test Forgot Password Flow**
1. Go to http://localhost:3000/login
2. Click "Forgot Password?" link
3. Enter registered email: `test@example.com`
4. Check backend console for reset link
5. Copy token from console output
6. Visit: `http://localhost:3000/reset-password/{token}`
7. Enter new password (min 6 chars)
8. Confirm password (must match)
9. Click "Reset Password"
10. Should see success message
11. Auto-redirect to Login
12. Login with new password

**Step 4: Test Error Scenarios**
- Invalid email → Generic success message (privacy)
- Invalid token → "Invalid or expired reset token"
- Expired token (>15 min) → "Reset token has expired"
- Non-matching passwords → "Passwords do not match"
- Password too short → "Password must be at least 6 characters"

---

### 2. Test Cases Checklist

**Positive Cases** ✓
- [ ] User enters valid registered email
- [ ] Reset link generates correctly
- [ ] Token contains valid JWT
- [ ] Token expires after 15 minutes
- [ ] User can reset password with valid token
- [ ] New password works for login
- [ ] Reset token cleared after reset
- [ ] Auto-redirect to Login works
- [ ] Unregistered email shows generic message

**Security Cases** ✓
- [ ] Token validates against JWT_SECRET
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] Password hashed with bcrypt
- [ ] Passwords must match
- [ ] Password minimum length enforced
- [ ] Reset token cleared after use
- [ ] User enumeration prevention works

**Edge Cases** ✓
- [ ] Empty email submission
- [ ] Empty password fields
- [ ] Non-matching passwords rejected
- [ ] Multiple reset requests handled
- [ ] Stale tokens don't work
- [ ] Browser refresh during reset works
- [ ] Direct URL access to reset-password page

---

## Production Deployment Checklist

### Before Going Live

#### Backend Security
- [ ] Remove `resetLink` from API response (currently only in dev)
- [ ] Integrate real email service (nodemailer, SendGrid, etc.)
- [ ] Update console.log to email service call
- [ ] Set proper `JWT_SECRET` in .env (long, random string)
- [ ] Review token expiry time (currently 15 min - adjust if needed)
- [ ] Enable HTTPS enforced on frontend
- [ ] Add rate limiting to /forgot-password endpoint
- [ ] Add rate limiting to /reset-password endpoint
- [ ] Log password reset attempts for audit trail

#### Frontend
- [ ] Remove development comments from code
- [ ] Test with production API endpoint
- [ ] Verify HTTPS used for reset links
- [ ] Test email client links (Gmail, Outlook, etc.)
- [ ] Check mobile responsiveness of reset pages
- [ ] Add analytics tracking for password resets

#### Database
- [ ] Backup database before running migration
- [ ] Verify migration runs successfully
- [ ] Test password reset flow on production database
- [ ] Monitor reset_token column for null values (cleanup job)

#### Documentation
- [ ] Update user help documentation
- [ ] Add password reset info to FAQ
- [ ] Train support team on password reset process
- [ ] Document email template sent to users

---

## Email Integration Example

### Using Nodemailer (Optional Reference)

```javascript
const nodemailer = require('nodemailer');

// In forgotPassword function:
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Lost & Found Platform',
    html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
    `
};

await transporter.sendMail(mailOptions);
```

---

## API Reference

### Endpoint 1: Request Password Reset

```
POST /api/auth/forgot-password
Content-Type: application/json

{
    "email": "user@example.com"
}

Response (200 OK):
{
    "message": "If an account with this email exists, a password reset link has been sent.",
    "resetLink": "http://localhost:3000/reset-password/{token}" // Dev only
}

Response (400 Bad Request):
{
    "message": "Email is required."
}

Response (500 Server Error):
{
    "message": "Server error during password reset request."
}
```

---

### Endpoint 2: Reset Password

```
POST /api/auth/reset-password/:token
Content-Type: application/json
Authorization: Not required

{
    "newPassword": "newPassword123",
    "confirmPassword": "newPassword123"
}

Response (200 OK):
{
    "message": "Password reset successfully. You can now login with your new password."
}

Response (400 Bad Request):
{
    "message": "Passwords do not match."
    // OR
    "message": "Password must be at least 6 characters."
    // OR
    "message": "New password and confirmation are required."
}

Response (401 Unauthorized):
{
    "message": "Invalid or expired reset token."
    // OR
    "message": "Reset token has expired."
}

Response (500 Server Error):
{
    "message": "Server error during password reset."
}
```

---

## Troubleshooting

### Issue: Reset link not appearing in console

**Solution**:
- Verify backend is running on port 5000
- Check console output in terminal where backend runs
- Ensure email exists in database before requesting reset

---

### Issue: "Invalid or expired reset token" error

**Solutions**:
- Token expires after 15 minutes, request new reset link
- Verify token matches exactly (no extra spaces)
- Check backend JWT_SECRET matches frontend expectations

---

### Issue: New password not working after reset

**Solutions**:
- Verify password was confirmed correctly (must match)
- Check password meets minimum 6 character requirement
- It may take 1-2 seconds for database update, try again
- Check browser console for specific error message

---

### Issue: Redirect to login not working

**Solutions**:
- Check browser JavaScript is enabled
- Verify '/login' route exists in App.js
- Check browser console for routing errors
- Manually navigate to /login if needed

---

## File Structure Summary

```
BACKEND CHANGES:
├── controllers/
│   └── authController.js (+ forgotPassword, resetPassword functions)
├── routes/
│   └── authRoutes.js (+ 2 new route definitions)
└── database/
    └── migration-add-reset-token.sql (NEW)

FRONTEND CHANGES:
├── src/
│   ├── services/
│   │   └── api.js (+ 2 new API methods)
│   ├── pages/
│   │   ├── Login.jsx (+ forgot password link)
│   │   ├── ForgotPassword.jsx (NEW)
│   │   └── ResetPassword.jsx (NEW)
│   └── App.js (+ routes & imports)
```

---

## No Breaking Changes ✓

- Existing login/register functionality unchanged
- No modifications to existing database tables (only additions)
- All new features are optional additions
- Backward compatible with existing user base

---

## Version History

- **v1.0** (Initial Release)
  - Added forgot password request endpoint
  - Added password reset endpoint
  - Added ForgotPassword React page
  - Added ResetPassword React page
  - Updated Login page with forgot password link
  - 15-minute token expiry
  - Bcrypt password hashing

---

## Support & Questions

For issues or questions about this implementation:
1. Check the Troubleshooting section above
2. Review the Test Cases to ensure proper setup
3. Check backend console for error logs
4. Verify database migration completed successfully
