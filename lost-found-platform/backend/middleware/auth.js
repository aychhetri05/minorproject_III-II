// middleware/auth.js
// Middleware to verify JWT token and attach user to request

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Protects routes — requires a valid Bearer token in Authorization header.
 * On success, attaches decoded user payload to req.user.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, name, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * Restricts access to admin-only routes.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};

/**
 * Generic role check middleware factory. Usage: roleMiddleware('police')
 * Must be used after `authMiddleware`.
 */
const roleMiddleware = (requiredRole) => (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ message: `${requiredRole} access required.` });
    }
    next();
};

/**
 * Allows access for both police AND admin roles.
 * Must be used AFTER authMiddleware.
 */
const policeOrAdminMiddleware = (req, res, next) => {
    if (!req.user || !['police', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Police or Admin access required.' });
    }
    next();
};

// Convenience middleware for police routes
const policeMiddleware = roleMiddleware('police');

module.exports = { authMiddleware, adminMiddleware, roleMiddleware, policeMiddleware, policeOrAdminMiddleware };

