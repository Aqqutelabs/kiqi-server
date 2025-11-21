"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const wallet_controller_1 = require("../controllers/wallet.controller");
const account_validation_1 = require("../validation/account.validation");
const router = (0, express_1.Router)();
// Protect all wallet routes
router.use(Auth_middlewares_1.verifyJWT);
router
    .route('/')
    .post((0, zod_validation_middleware_1.validateRequest)(account_validation_1.walletSchema), wallet_controller_1.walletController.addWallet)
    .get(wallet_controller_1.walletController.getWallets);
// Balance and transaction routes
router.get('/balance', wallet_controller_1.walletController.getWalletBalance);
router.get('/transactions', wallet_controller_1.walletController.getTransactionHistory);
// Credit operations
router.post('/credits/add', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.walletOperationsSchema.addCredits), wallet_controller_1.walletController.addCredits);
router.post('/credits/deduct', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.walletOperationsSchema.deductCredits), wallet_controller_1.walletController.deductCredits);
router.post('/credits/convert', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.walletOperationsSchema.convertCredits), wallet_controller_1.walletController.convertCreditsToCoins);
// Wallet management
router
    .route('/:id')
    .put((0, zod_validation_middleware_1.validateRequest)(account_validation_1.walletSchema.partial()), wallet_controller_1.walletController.updateWallet)
    .delete(wallet_controller_1.walletController.deleteWallet);
// router.post('/:id/set-default', walletController.setDefaultWallet);
exports.default = router;
