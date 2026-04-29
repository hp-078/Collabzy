const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  ledger: [
    {
      transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction' },
      type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
      delta: { type: Number },
      balanceAfter: { type: Number },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);
