import { Router } from 'express';
import { verifyJWT, AuthRequest } from '../middlewares/Auth.middlewares';
import { registerValidator, loginValidator, resetPasswordValidator, walletLoginValidator } from '../middlewares/validation.middleware';
import { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, getWeb3LoginMessage, loginWithWallet } from '../middlewares/Validation.middlewares';

const router = Router();

// Traditional Auth
// router.route('/register').post(registerValidator, registerUser);
// router.route('/login').post(loginValidator, loginUser);
router.route('/logout').post(verifyJWT, logoutUser);

// Password Reset
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPasswordValidator, resetPassword);

// Web3 Wallet Auth
router.route('/web3-login-message').get(getWeb3LoginMessage);
router.route('/web3-login').post(walletLoginValidator, loginWithWallet);

// A protected route example
router.route('/me').get(verifyJWT, (req: AuthRequest, res) => {
    res.status(200).json({ success: true, user: req.user });
});

export default router;