import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import phantomController from '../controllers/phantom.controller';
import { phantomSchema } from '../validation/account.validation';

const router = Router();

// Protect all phantom wallet routes
router.use(verifyJWT);

// Phantom wallet connection routes
router.post('/connect', validateRequest(phantomSchema.connect), phantomController.connectPhantomWallet);
router.post('/disconnect', phantomController.disconnectPhantomWallet);

// Balance and transaction routes
router.get('/balance', phantomController.getPhantomBalance);
router.get('/transactions', phantomController.getPhantomTransactions);

// Transfer routes
router.post('/transfer', validateRequest(phantomSchema.transfer), phantomController.transferToPhantom);
router.post('/verify-transfer', validateRequest(phantomSchema.verifyTransfer), phantomController.verifyPhantomTransfer);

export default router;