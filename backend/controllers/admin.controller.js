// backend/controllers/admin.controller.js
// Admin moderation and management controller

const User = require('../models/User.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const Report = require('../models/Report.model');
const Violation = require('../models/Violation.model');
const Deal = require('../models/Deal.model');
const Payment = require('../models/Payment.model');
const trustScoreService = require('../services/trustScore.service');
const { createNotificationFromTemplate } = require('../services/notification.service');

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [userStats, dealStats, paymentStats, reportStats, violationStats] = await Promise.all([
            // User statistics
            User.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Deal statistics
            Deal.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Payment statistics
            Payment.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$platformFee' },
                        totalTransactions: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]),

            // Report statistics
            Report.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Violation statistics
            Violation.aggregate([
                {
                    $group: {
                        _id: '$violationType',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Recent activity
        const recentReports = await Report.find()
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email role')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentViolations = await Violation.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            stats: {
                users: userStats,
                deals: dealStats,
                payments: paymentStats[0] || { totalRevenue: 0, totalTransactions: 0, totalAmount: 0 },
                reports: reportStats,
                violations: violationStats
            },
            recent: {
                reports: recentReports,
                violations: recentViolations
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
};

/**
 * Get all users with filters
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -tokenVersion')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

/**
 * Suspend user account
 * PATCH /api/admin/users/:userId/suspend
 */
exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, duration } = req.body; // duration in days

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Suspension reason is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Cannot suspend admin users'
            });
        }

        // Calculate suspension end date
        const suspensionEnd = duration 
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
            : null;

        user.status = 'suspended';
        user.suspensionReason = reason;
        user.suspendedAt = new Date();
        user.suspensionEnd = suspensionEnd;
        await user.save();

        // Update trust score for influencers
        if (user.role === 'influencer') {
            try {
                await trustScoreService.updateTrustScore(
                    userId,
                    'SUSPENSION',
                    { reason, duration }
                );
            } catch (trustErr) {
                console.error('Trust score update error:', trustErr);
            }
        }

        // Notify user
        try {
            await createNotificationFromTemplate(userId, 'ACCOUNT_SUSPENDED', {
                reason,
                duration: duration ? `${duration} days` : 'indefinite'
            });
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.json({
            success: true,
            message: 'User suspended successfully',
            user: {
                id: user._id,
                status: user.status,
                suspensionEnd
            }
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to suspend user'
        });
    }
};

/**
 * Reactivate suspended user
 * PATCH /api/admin/users/:userId/reactivate
 */
exports.reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.status !== 'suspended') {
            return res.status(400).json({
                success: false,
                error: 'User is not suspended'
            });
        }

        user.status = 'active';
        user.suspensionReason = null;
        user.suspendedAt = null;
        user.suspensionEnd = null;
        await user.save();

        // Notify user
        try {
            await createNotificationFromTemplate(userId, 'ACCOUNT_REACTIVATED', {});
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.json({
            success: true,
            message: 'User reactivated successfully'
        });
    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reactivate user'
        });
    }
};

/**
 * Verify influencer profile
 * PATCH /api/admin/influencers/:influencerId/verify
 */
exports.verifyInfluencer = async (req, res) => {
    try {
        const { influencerId } = req.params;

        const profile = await InfluencerProfile.findOne({ user: influencerId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Influencer profile not found'
            });
        }

        profile.isVerified = true;
        profile.verified = true;
        profile.verifiedAt = new Date();
        await profile.save();

        // Update trust score
        try {
            await trustScoreService.updateTrustScore(
                influencerId,
                'PROFILE_VERIFIED',
                { verifiedBy: req.user._id }
            );
        } catch (trustErr) {
            console.error('Trust score update error:', trustErr);
        }

        // Notify influencer
        try {
            await createNotificationFromTemplate(influencerId, 'PROFILE_VERIFIED', {});
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.json({
            success: true,
            message: 'Influencer verified successfully'
        });
    } catch (error) {
        console.error('Verify influencer error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify influencer'
        });
    }
};

/**
 * Get all reports with filters
 * GET /api/admin/reports
 */
exports.getReports = async (req, res) => {
    try {
        const { status, severity, reportType, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (severity) filter.severity = severity;
        if (reportType) filter.reportType = reportType;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reporter', 'name email')
                .populate('reportedUser', 'name email role')
                .populate('assignedAdmin', 'name')
                .sort({ priority: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Report.countDocuments(filter)
        ]);

        res.json({
            success: true,
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    }
};

/**
 * Handle report (resolve/dismiss)
 * PATCH /api/admin/reports/:reportId
 */
exports.handleReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { action, reason, status } = req.body;

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Update report
        report.status = status || 'resolved';
        report.resolution = {
            action,
            reason,
            resolvedAt: new Date(),
            resolvedBy: req.user._id
        };
        await report.save();

        // Take action based on resolution
        if (action === 'user_suspended') {
            await User.findByIdAndUpdate(report.reportedUser, {
                status: 'suspended',
                suspensionReason: reason,
                suspendedAt: new Date()
            });
        } else if (action === 'warning') {
            try {
                await trustScoreService.updateTrustScore(
                    report.reportedUser.toString(),
                    'ACCOUNT_WARNING',
                    { reportId, reason }
                );
            } catch (trustErr) {
                console.error('Trust score update error:', trustErr);
            }
        }

        res.json({
            success: true,
            message: 'Report handled successfully',
            report
        });
    } catch (error) {
        console.error('Handle report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to handle report'
        });
    }
};

/**
 * Get violations with filters
 * GET /api/admin/violations
 */
exports.getViolations = async (req, res) => {
    try {
        const { userId, violationType, reviewStatus, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;
        if (violationType) filter.violationType = violationType;
        if (reviewStatus) filter.reviewStatus = reviewStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [violations, total] = await Promise.all([
            Violation.find(filter)
                .populate('userId', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Violation.countDocuments(filter)
        ]);

        res.json({
            success: true,
            violations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get violations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch violations'
        });
    }
};

/**
 * Review violation
 * PATCH /api/admin/violations/:violationId
 */
exports.reviewViolation = async (req, res) => {
    try {
        const { violationId } = req.params;
        const { reviewStatus, adminNotes } = req.body;

        const violation = await Violation.findById(violationId);
        if (!violation) {
            return res.status(404).json({
                success: false,
                error: 'Violation not found'
            });
        }

        violation.reviewStatus = reviewStatus;
        if (adminNotes) {
            violation.adminNotes = adminNotes;
        }
        violation.reviewedBy = req.user._id;
        violation.reviewedAt = new Date();
        await violation.save();

        res.json({
            success: true,
            message: 'Violation reviewed successfully',
            violation
        });
    } catch (error) {
        console.error('Review violation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to review violation'
        });
    }
};

module.exports = exports;
