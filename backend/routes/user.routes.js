import express from 'express';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Placeholder routes - will be implemented later
router.get('/profile', (req, res) => {
  res.json({ message: 'Get user profile - To be implemented' });
});

export default router;
