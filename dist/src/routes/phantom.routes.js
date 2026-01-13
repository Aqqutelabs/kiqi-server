"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const phantom_controller_1 = __importDefault(require("../controllers/phantom.controller"));
const account_validation_1 = require("../validation/account.validation");
const router = (0, express_1.Router)();
// Protect all phantom wallet routes
router.use(Auth_middlewares_1.verifyJWT);
// Phantom wallet connection routes
router.post('/connect', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.phantomSchema.connect), phantom_controller_1.default.connectPhantomWallet);
router.post('/disconnect', phantom_controller_1.default.disconnectPhantomWallet);
// Balance and transaction routes
router.get('/balance', phantom_controller_1.default.getPhantomBalance);
router.get('/transactions', phantom_controller_1.default.getPhantomTransactions);
// Transfer routes
router.post('/transfer', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.phantomSchema.transfer), phantom_controller_1.default.transferToPhantom);
router.post('/verify-transfer', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.phantomSchema.verifyTransfer), phantom_controller_1.default.verifyPhantomTransfer);
exports.default = router;
