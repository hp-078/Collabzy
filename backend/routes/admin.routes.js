// backend/routes/admin.routes.js
// Admin moderation and management routes

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/suspend', adminController.suspendUser);
router.patch('/users/:userId/reactivate', adminController.reactivateUser);

// Influencer verification
router.patch('/influencers/:influencerId/verify', adminController.verifyInfluencer);

// Report management
router.get('/reports', adminController.getReports);
router.patch('/reports/:reportId', adminController.handleReport);

// Violation management
router.get('/violations', adminController.getViolations);
router.patch('/violations/:violationId', adminController.reviewViolation);

module.exports = router;
