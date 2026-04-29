const assert = require('assert');

const paymentService = require('../services/payment.service');
const walletService = require('../services/wallet.service');
const paymentController = require('../controllers/payment.controller');
const walletController = require('../controllers/wallet.controller');
const paymentRoutes = require('../routes/payment.routes');
const walletRoutes = require('../routes/wallet.routes');

function hasFunction(object, name) {
  return typeof object?.[name] === 'function';
}

assert.ok(hasFunction(paymentService, 'createOrder'));
assert.ok(hasFunction(paymentService, 'verifyAndEscrow'));
assert.ok(hasFunction(paymentService, 'releasePayment'));
assert.ok(hasFunction(paymentService, 'refundPayment'));
assert.ok(hasFunction(paymentService, 'handleWebhook'));

assert.ok(hasFunction(walletService, 'getOrCreateWalletForUser'));
assert.ok(hasFunction(walletService, 'creditWallet'));
assert.ok(hasFunction(walletService, 'debitWallet'));
assert.ok(hasFunction(walletService, 'getAdminUserId'));

assert.ok(hasFunction(paymentController, 'createOrder'));
assert.ok(hasFunction(paymentController, 'verifyPayment'));
assert.ok(hasFunction(paymentController, 'releasePayment'));
assert.ok(hasFunction(paymentController, 'refundPayment'));
assert.ok(hasFunction(paymentController, 'handleWebhook'));

assert.ok(hasFunction(walletController, 'getMyWallet'));
assert.ok(hasFunction(walletController, 'listWallets'));
assert.ok(typeof paymentRoutes === 'function');
assert.ok(typeof walletRoutes === 'function');

console.log('Smoke tests passed: payment and wallet modules load correctly.');
