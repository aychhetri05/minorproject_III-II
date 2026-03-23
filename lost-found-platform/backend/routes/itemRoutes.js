// routes/itemRoutes.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { authMiddleware, adminMiddleware, policeOrAdminMiddleware } = require('../middleware/auth');
const {
    createItem,
    getAllItems,
    getOpenItems,
    getItemById,
    getAllMatches,
    updateItemStatus,
    getStats,
    submitPhysical,
    deleteItem
} = require('../controllers/itemController');

// ---- Multer configuration for image uploads ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // save to /backend/uploads
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp + original extension
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ---- Public routes ----
router.get('/',         getAllItems);   // GET /api/items
router.get('/open',     getOpenItems); // GET /api/items/open
router.get('/:id',      getItemById);  // GET /api/items/:id

// ---- Authenticated user routes ----
router.post('/', authMiddleware, upload.single('image'), createItem); // POST /api/items

// Submit found item physically to police (authenticated found user)
router.post('/:id/submit-physical', authMiddleware, submitPhysical);
router.delete('/:id', authMiddleware, deleteItem);

// ---- Admin / Police routes ----
router.get('/admin/matches',          authMiddleware, adminMiddleware, getAllMatches);
router.get('/admin/stats',            authMiddleware, adminMiddleware, getStats);
router.patch('/:id/status',           authMiddleware, policeOrAdminMiddleware, updateItemStatus);

module.exports = router;
