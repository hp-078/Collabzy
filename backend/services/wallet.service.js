const Wallet = require('../models/Wallet.model');
const User = require('../models/User.model');

async function getOrCreateWalletForUser(userId, session = null) {
  return Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, balance: 0, currency: 'INR', ledger: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
}

async function creditWallet(userId, amount, txId, session = null, note = '') {
  if (amount <= 0) return null;
  const wallet = await getOrCreateWalletForUser(userId, session);
  wallet.balance = (wallet.balance || 0) + amount;
  wallet.ledger.push({
    transaction: txId,
    type: 'credit',
    delta: amount,
    balanceAfter: wallet.balance,
    note
  });
  await wallet.save({ session });
  return wallet;
}

async function debitWallet(userId, amount, txId, session = null, note = '') {
  if (amount <= 0) return null;
  const wallet = await getOrCreateWalletForUser(userId, session);
  if ((wallet.balance || 0) < amount) {
    throw new Error(`Insufficient funds in wallet (has ₹${wallet.balance}, needs ₹${amount})`);
  }
  wallet.balance = wallet.balance - amount;
  wallet.ledger.push({
    transaction: txId,
    type: 'debit',
    delta: -amount,
    balanceAfter: wallet.balance,
    note
  });
  await wallet.save({ session });
  return wallet;
}

async function getAdminUserId() {
  const admin = await User.findOne({ role: 'admin' });
  return admin ? admin._id : null;
}

module.exports = {
  getOrCreateWalletForUser,
  creditWallet,
  debitWallet,
  getAdminUserId
};
