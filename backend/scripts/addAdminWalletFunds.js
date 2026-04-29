/**
 * Script: addAdminWalletFunds.js
 * Usage: node scripts/addAdminWalletFunds.js [amount]
 * Default amount: 100000 (Rs.1,00,000)
 *
 * Credits the specified amount to the admin user's wallet.
 * Run from the backend directory.
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const amount = parseFloat(process.argv[2]) || 100000;

  console.log('\n Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  // Load models AFTER connection
  const User   = require('../models/User.model');
  const Wallet = require('../models/Wallet.model');

  // Find admin user
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Please create an admin account first.');
    process.exit(1);
  }

  console.log('Admin found: ' + (admin.name || admin.email) + ' (' + admin._id + ')');

  // Upsert wallet
  let wallet = await Wallet.findOne({ user: admin._id });
  if (!wallet) {
    wallet = await Wallet.create({
      user: admin._id,
      balance: 0,
      currency: 'INR',
      ledger: []
    });
    console.log('Admin wallet created (was missing).');
  }

  const previousBalance = wallet.balance || 0;
  const newBalance      = previousBalance + amount;

  wallet.balance = newBalance;
  wallet.ledger.push({
    type: 'credit',
    delta: amount,
    balanceAfter: newBalance,
    note: 'Manual top-up: Rs.' + amount.toLocaleString('en-IN') + ' added by script on ' + new Date().toLocaleString('en-IN'),
    createdAt: new Date()
  });

  await wallet.save();

  console.log('\nAdmin Wallet Updated');
  console.log('   Previous balance : Rs.' + previousBalance.toLocaleString('en-IN'));
  console.log('   Amount credited  : Rs.' + amount.toLocaleString('en-IN'));
  console.log('   New balance      : Rs.' + newBalance.toLocaleString('en-IN'));
  console.log('\nDone!\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
