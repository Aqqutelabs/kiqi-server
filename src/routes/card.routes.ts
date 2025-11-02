import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { cardController } from '../controllers/card.controller';
import { cardSchema } from '../validation/account.validation';

const router = Router();

// Protect all card routes
router.use(verifyJWT);

router
    .route('/')
    .post(validateRequest(cardSchema), cardController.addCard)
    .get(cardController.getCards);

router.get('/default', cardController.getDefaultCard);

router
    .route('/:id')
    .put(validateRequest(cardSchema.partial()), cardController.updateCard)
    .delete(cardController.deleteCard);

router.post('/:id/set-default', cardController.setDefaultCard);

export default router;