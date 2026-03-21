// routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
// Request: { email }
// Response: { message, resetLink (dev only) }
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
// Request: { newPassword, confirmPassword }
// Response: { message }
router.post('/reset-password/:token', resetPassword);

module.exports = router;
