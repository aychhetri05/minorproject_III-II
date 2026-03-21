// routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { authMiddleware } = require('../middleware/auth');
const { updateProfile, getProfile } = require('../controllers/userController');

// ---- Multer configuration for profile picture uploads ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // same as items
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `profile-${req.user.id}-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const profileAllowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const documentAllowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

    if (file.fieldname === 'profilePicture') {
        return profileAllowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Profile picture must be an image (jpg, png, webp).'), false);
    }

    if (file.fieldname === 'verifiedDocument') {
        return documentAllowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Verified document must be PDF or image (jpg, png, webp).'), false);
    }

    // Fallback: reject unknown fields
    cb(new Error('Unsupported file field.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit for either file

// GET /api/users/profile - Get current user's profile
router.get('/profile', authMiddleware, getProfile);

// PUT /api/users/profile - Update current user's profile (with optional image and verified document)
router.put(
    '/profile',
    authMiddleware,
    upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'verifiedDocument', maxCount: 1 },
    ]),
    updateProfile
);

module.exports = router;