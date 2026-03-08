// backend/utils/tokens.js
// Token generation and verification utilities

const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived, 15 minutes)
 * Stored in frontend memory/state
 */
function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );
}

/**
 * Generate Refresh Token (long-lived, 7 days)
 * Stored in HTTP-only cookie
 */
function generateRefreshToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            tokenVersion: user.tokenVersion || 0
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

/**
 * Set refresh token as HTTP-only cookie
 */
function setRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

/**
 * Clear refresh token cookie
 */
function clearRefreshTokenCookie(res) {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    extractToken,
    setRefreshTokenCookie,
    clearRefreshTokenCookie
};
