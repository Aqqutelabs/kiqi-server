import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { walletController } from '../controllers/wallet.controller';
import { walletSchema, walletOperationsSchema } from '../validation/account.validation';

const router = Router();

// Protect all wallet routes
router.use(verifyJWT);

router
    .route('/')
    .post(validateRequest(walletSchema), walletController.addWallet)
    .get(walletController.getWallets);

// Balance and transaction routes
router.get('/balance', walletController.getWalletBalance);
router.get('/transactions', walletController.getTransactionHistory);
router.get('/usage/overview', walletController.getUsageOverview);

// Credit operations
router.post('/credits/add', validateRequest(walletOperationsSchema.addCredits), walletController.addCredits);
router.post('/credits/deduct', validateRequest(walletOperationsSchema.deductCredits), walletController.deductCredits);
router.post('/credits/convert', validateRequest(walletOperationsSchema.convertCredits), walletController.convertCreditsToCoins);

// Wallet management
router
    .route('/:id')
    .put(validateRequest(walletSchema.partial()), walletController.updateWallet)
    .delete(walletController.deleteWallet);

// router.post('/:id/set-default', walletController.setDefaultWallet);

export default router;