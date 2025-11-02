import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { walletController } from '../controllers/wallet.controller';
import { walletSchema } from '../validation/account.validation';

const router = Router();

// Protect all wallet routes
router.use(verifyJWT);

router
    .route('/')
    .post(validateRequest(walletSchema), walletController.addWallet)
    .get(walletController.getWallets);

router
    .route('/:id')
    .put(validateRequest(walletSchema.partial()), walletController.updateWallet)
    .delete(walletController.deleteWallet);

// router.post('/:id/set-default', walletController.setDefaultWallet);

export default router;