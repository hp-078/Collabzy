// backend/middleware/auth.middleware.enhanced.js
// Enhanced authentication middleware with refresh token support

const { verifyAccessToken, extractToken } = require('../utils/tokens');
const User = require('../models/User.model');

/**
 * Verify JWT access token and attach user to request
 */
async function authenticateToken(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired access token'
            });
        }

        // Fetch user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                error: 'Account suspended. Contact support.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Role-based access control middleware
 * Usage: authorize('brand', 'admin')
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = verifyAccessToken(token);
            if (decoded) {
                const user = await User.findById(decoded.userId).select('-password');
                if (user) {
                    req.user = user;
                    req.userId = user._id;
                    req.userRole = user.role;
                }
            }
        }

        next();
    } catch (error) {
        // Silent fail for optional auth
        next();
    }
}

/**
 * Check if user owns the resource
 * Compares req.user.id with req.params.userId or req.body.userId
 */
function isResourceOwner(req, res, next) {
    const resourceUserId = req.params.userId || req.body.userId;

    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user._id.toString() !== resourceUserId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to access this resource'
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    authorize,
    optionalAuth,
    isResourceOwner
};
