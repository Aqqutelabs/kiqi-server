"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const Validation_middlewares_1 = require("../middlewares/Validation.middlewares");
const router = (0, express_1.Router)();
// Traditional Auth
router.route('/register').post(validation_middleware_1.registerValidator, Validation_middlewares_1.registerUser);
router.route('/login').post(validation_middleware_1.loginValidator, Validation_middlewares_1.loginUser);
router.route('/logout').post(Auth_middlewares_1.verifyJWT, Validation_middlewares_1.logoutUser);
// Password Reset
router.route('/forgot-password').post(Validation_middlewares_1.forgotPassword);
router.route('/reset-password').post(validation_middleware_1.resetPasswordValidator, Validation_middlewares_1.resetPassword);
// Web3 Wallet Auth
router.route('/web3-login-message').get(Validation_middlewares_1.getWeb3LoginMessage);
router.route('/web3-login').post(validation_middleware_1.walletLoginValidator, Validation_middlewares_1.loginWithWallet);
// A protected route example
router.route('/me').get(Auth_middlewares_1.verifyJWT, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});
exports.default = router;
