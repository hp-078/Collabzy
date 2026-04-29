const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['escrow', 'release', 'refund'], required: true },
  status: { type: String, enum: ['held', 'released', 'refunded', 'failed'], required: true, default: 'held' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  meta: { type: Object, default: {} },
  externalRef: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
