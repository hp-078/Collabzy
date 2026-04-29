const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/me', requireAuth, walletController.getMyWallet);
router.get('/all', requireAuth, requireAdmin, walletController.listWallets);

module.exports = router;
