const Wallet = require('../models/Wallet.model');
const { requireAuth } = require('../middleware/auth.middleware');

exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id })
      .populate('user', 'name email role')
      .populate('ledger.transaction');
    if (!wallet) return res.json({ success: true, data: { balance: 0, ledger: [] } });
    res.json({ success: true, data: wallet });
  } catch (err) {
    console.error('Get my wallet error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
};

// Admin: list all wallets (summary)
exports.listWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate('user', 'name email role')
      .populate('ledger.transaction');
    res.json({ success: true, data: wallets });
  } catch (err) {
    console.error('List wallets error:', err);
    res.status(500).json({ success: false, message: 'Failed to list wallets' });
  }
};
