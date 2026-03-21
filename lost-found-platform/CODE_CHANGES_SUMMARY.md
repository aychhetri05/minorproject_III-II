# Forgot Password Feature - Code Summary

## All Changes Made

This document summarizes every code change made to implement the Forgot Password feature.

---

## 1. BACKEND - Password Reset Logic

### File: `backend/controllers/authController.js`

**Added Functions**:

```javascript
/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and send reset link
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const [rows] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            // Generic response - security best practice
            return res.status(200).json({
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        const user = rows[0];

        // Generate JWT reset token (15 minute expiry)
        const resetToken = jwt.sign(
            { id: user.id, email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Calculate expiry time
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

        // Save token to database
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, expiryTime, user.id]
        );

        // Log reset link (replace with email service in production)
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        console.log(`\n🔐 PASSWORD RESET LINK FOR ${email}:\n${resetLink}\n`);

        res.status(200).json({
            message: 'If an account with this email exists, a password reset link has been sent.',
            resetLink // Dev only - remove in production
        });
    } catch (err) {
        console.error('[ForgotPassword]', err.message);
        res.status(500).json({ message: 'Server error during password reset request.' });
    }
};

/**
 * POST /api/auth/reset-password/:token
 * Verify reset token and update user's password
 */
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validation
    if (!token) {
        return res.status(400).json({ message: 'Reset token is required.' });
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'New password and confirmation are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ message: 'Invalid or expired reset token.' });
        }

        // Find user and verify token
        const [rows] = await db.query(
            'SELECT id, email FROM users WHERE id = ? AND reset_token = ?',
            [decoded.id, token]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid or expired reset token.' });
        }

        const user = rows[0];

        // Check token expiry
        const [expiryRows] = await db.query(
            'SELECT reset_token_expiry FROM users WHERE id = ?',
            [user.id]
        );

        if (expiryRows.length === 0 || !expiryRows[0].reset_token_expiry) {
            return res.status(401).json({ message: 'Reset token has expired.' });
        }

        const expiryTime = new Date(expiryRows[0].reset_token_expiry);
        if (expiryTime < new Date()) {
            return res.status(401).json({ message: 'Reset token has expired.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password and clear reset fields
        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (err) {
        console.error('[ResetPassword]', err.message);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

module.exports = { register, login, forgotPassword, resetPassword };
```

---

## 2. BACKEND - Routes

### File: `backend/routes/authRoutes.js`

**Complete Updated File**:

```javascript
// routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
```

---

## 3. FRONTEND - API Service

### File: `frontend/src/services/api.js`

**Added to Auth Section**:

```javascript
// ---- Auth ----
export const registerUser = (data)  => api.post('/auth/register', data);
export const loginUser    = (data)  => api.post('/auth/login', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data);
```

---

## 4. FRONTEND - Login Page Update

### File: `frontend/src/pages/Login.jsx`

**Password Field Section - BEFORE**:
```jsx
<div className="mb-4">
    <label className="form-label fw-semibold">Password</label>
    <input
        type="password"
        name="password"
        className="form-control"
        placeholder="Your password"
        value={form.password}
        onChange={handleChange}
        required
    />
</div>
```

**Password Field Section - AFTER**:
```jsx
<div className="mb-4">
    <div className="d-flex justify-content-between align-items-center">
        <label className="form-label fw-semibold">Password</label>
        <Link to="/forgot-password" className="text-decoration-none small">Forgot Password?</Link>
    </div>
    <input
        type="password"
        name="password"
        className="form-control"
        placeholder="Your password"
        value={form.password}
        onChange={handleChange}
        required
    />
</div>
```

---

## 5. FRONTEND - Forgot Password Page (NEW)

### File: `frontend/src/pages/ForgotPassword.jsx`

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await forgotPassword({ email });
            setSuccess(res.data.message || 'If an account with this email exists, you will receive a reset link.');
            setEmail('');

            if (res.data.resetLink) {
                console.log('Dev Mode - Reset Link:', res.data.resetLink);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center">
            <div className="container" style={{ maxWidth: 460 }}>
                <div className="card shadow">
                    <div className="card-body p-4">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold text-primary">🔑 Forgot Password?</h2>
                            <p className="text-muted">We'll help you reset your password</p>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}

                        <p className="text-muted small mb-3">
                            Enter your email address and we'll send you a link to reset your password. This link will expire in 15 minutes.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="ram@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <hr />

                        <div className="text-center">
                            <p className="mb-0">
                                Remember your password? <Link to="/login">Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
```

---

## 6. FRONTEND - Reset Password Page (NEW)

### File: `frontend/src/pages/ResetPassword.jsx`

```javascript
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.newPassword !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const res = await resetPassword(token, {
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword
            });

            setSuccess(res.data.message);
            setForm({ newPassword: '', confirmPassword: '' });

            setTimeout(() => {
                navigate('/login', { 
                    state: { message: 'Password reset successfully! Please login with your new password.' }
                });
            }, 2000);
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const status = err.response?.status;
            setError(serverMsg || (status ? `Request failed (${status})` : err.message) || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center">
            <div className="container" style={{ maxWidth: 460 }}>
                <div className="card shadow">
                    <div className="card-body p-4">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold text-primary">🔐 Reset Password</h2>
                            <p className="text-muted">Create a new password for your account</p>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <small className="text-muted">Minimum 6 characters</small>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-semibold">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>

                        {success && (
                            <div className="mt-3 p-2 bg-light border rounded small text-muted">
                                ✓ Redirecting to login...
                            </div>
                        )}

                        <hr />

                        <div className="text-center">
                            <p className="mb-0">
                                <Link to="/login">Back to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
```

---

## 7. FRONTEND - App.js Routes

### File: `frontend/src/App.js`

**Additions to Imports**:
```javascript
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
```

**Additions to Routes**:
```javascript
{/* Public */}
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
```

---

## 8. DATABASE - Migration

### File: `database/migration-add-reset-token.sql`

```sql
-- ============================================================
-- Migration: Add Password Reset Functionality
-- Adds reset_token and reset_token_expiry fields to users table
-- ============================================================

USE lost_found_db;

-- Add reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL;

-- Optional: Add index on reset_token for faster lookups
CREATE INDEX idx_reset_token ON users(reset_token);

-- Verify the columns were added
DESCRIBE users;
```

---

## Summary of Changes

| Component | Type | Lines Added | Purpose |
|-----------|------|-------------|---------|
| Auth Controller | Modified | ~100 | Password reset logic |
| Auth Routes | Modified | 4 | Route definitions |
| API Service | Modified | 2 | Frontend API methods |
| Login Page | Modified | 3 | Forgot password link |
| Forgot Password | New | ~70 | Reset request form |
| Reset Password | New | ~100 | Password reset form |
| App.js Routes | Modified | 2 | Route configuration |
| Database | New | 6 | Schema migration |

**Total New/Modified Files**: 8  
**Total Lines of Code**: ~290 lines  
**Estimated Implementation Time**: ~2 hours with testing

---

## No Breaking Changes

✅ All existing authentication functions remain unchanged  
✅ No modifications to existing routes or endpoints  
✅ No changes to existing database tables (only additions)  
✅ Fully backward compatible with current user base  
✅ Can be deployed without affecting any other features

---

End of Code Summary
