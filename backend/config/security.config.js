// backend/config/security.config.js
// Security configuration for production

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { body, query, param } = require('express-validator');

/**
 * Helmet security headers configuration
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:5173', 'http://localhost:3000'];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Rate limiting configurations
 */
const rateLimiters = {
    // Strict rate limiting for authentication endpoints
    auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false
    }),

    // Rate limiting for registration
    register: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 registrations per hour per IP
        message: 'Too many accounts created, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Rate limiting for password reset
    passwordReset: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 attempts per hour
        message: 'Too many password reset attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    }),

    // General API rate limiting
    api: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'Too many requests, please slow down',
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Stricter rate limiting for message sending
    message: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 messages per minute
        message: 'Too many messages sent, please wait',
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Payment endpoint rate limiting
    payment: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 payment attempts per 15 minutes
        message: 'Too many payment attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    })
};

/**
 * MongoDB sanitization to prevent NoSQL injection
 */
const mongoSanitizeConfig = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized potentially malicious input: ${key}`);
    }
});

/**
 * Input validation schemas
 */
const validationSchemas = {
    // User registration
    register: [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        body('name').trim().isLength({ min: 2, max: 100 }),
        body('role').isIn(['brand', 'influencer'])
    ],

    // User login
    login: [
        body('email').isEmail().normalizeEmail(),
        body('password').exists()
    ],

    // Campaign creation
    createCampaign: [
        body('title').trim().isLength({ min: 5, max: 200 }),
        body('description').trim().isLength({ min: 20, max: 5000 }),
        body('budget').isNumeric().custom(value => value > 0),
        body('category').isString(),
        body('platformType').isIn(['YouTube', 'Instagram', 'TikTok', 'Multiple'])
    ],

    // Deal creation
    createDeal: [
        body('applicationId').isMongoId(),
        body('agreedRate').isNumeric().custom(value => value > 0),
        body('deliverables').isArray().isLength({ min: 1 })
    ],

    // Review creation
    createReview: [
        body('dealId').isMongoId(),
        body('rating').isInt({ min: 1, max: 5 }),
        body('content').trim().isLength({ min: 10, max: 2000 })
    ],

    // Message sending
    sendMessage: [
        body('receiverId').isMongoId(),
        body('content').trim().isLength({ min: 1, max: 5000 })
    ],

    // Payment order
    createPaymentOrder: [
        body('dealId').isMongoId(),
        body('amount').isNumeric().custom(value => value > 0)
    ],

    // MongoDB ID validation
    mongoId: [
        param('id').isMongoId()
    ],

    // Pagination
    pagination: [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ]
};

/**
 * XSS protection middleware
 */
const xssProtection = (req, res, next) => {
    const xssPattern = /<script[\s\S]*?>[\s\S]*?<\/script>|<iframe[\s\S]*?>[\s\S]*?<\/iframe>|javascript:|onerror=|onload=/gi;
    
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                if (xssPattern.test(obj[key])) {
                    console.warn(`XSS attempt detected in ${key}: ${obj[key]}`);
                    obj[key] = obj[key].replace(xssPattern, '');
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        if (res.statusCode >= 400) {
            console.error('Request error:', log);
        } else if (duration > 1000) {
            console.warn('Slow request:', log);
        }
    });

    next();
};

/**
 * Environment variable validation
 */
const validateEnv = () => {
    const required = [
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        process.exit(1);
    }

    // Validate JWT secrets are strong
    if (process.env.JWT_SECRET.length < 32) {
        console.error('JWT_SECRET must be at least 32 characters');
        process.exit(1);
    }

    if (process.env.JWT_REFRESH_SECRET.length < 32) {
        console.error('JWT_REFRESH_SECRET must be at least 32 characters');
        process.exit(1);
    }

    console.log('✓ Environment variables validated');
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: 'Duplicate entry',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
};

module.exports = {
    helmetConfig,
    corsOptions,
    rateLimiters,
    mongoSanitizeConfig,
    validationSchemas,
    xssProtection,
    requestLogger,
    validateEnv,
    errorHandler
};
