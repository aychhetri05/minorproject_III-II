// server.js
// Entry point for the Lost & Found Platform Backend

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const policeRoutes = require('./routes/policeRoutes');
const { authMiddleware, adminMiddleware, policeOrAdminMiddleware } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors({
    origin: 'http://localhost:3000', // React dev server
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Serve uploaded images as static files ----
// Access uploaded images at: http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Routes ----
app.use('/api', authRoutes);        // /api/register, /api/login
app.use('/api/items', itemRoutes);  // /api/items, /api/items/open, etc.

// Admin-only routes (protected)
app.use('/api/admin', authMiddleware, adminMiddleware, require('./routes/adminRoutes'));

// Police/Admin routes (protected - both roles can access)
app.use('/api/police', authMiddleware, policeOrAdminMiddleware, policeRoutes);

// Notifications (protected by auth)
app.use('/api/notifications', authMiddleware, require('./routes/notificationRoutes'));

// Admin stats/matches use a separate prefix to avoid :id conflict
app.get('/api/admin/stats',    authMiddleware,
                                adminMiddleware,
                                require('./controllers/itemController').getStats);

app.get('/api/admin/matches',  authMiddleware,
                                adminMiddleware,
                                require('./controllers/itemController').getAllMatches);

// ---- Health check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

