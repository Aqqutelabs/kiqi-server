"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const card_controller_1 = require("../controllers/card.controller");
const account_validation_1 = require("../validation/account.validation");
const router = (0, express_1.Router)();
// Protect all card routes
router.use(Auth_middlewares_1.verifyJWT);
router
    .route('/')
    .post((0, zod_validation_middleware_1.validateRequest)(account_validation_1.cardSchema), card_controller_1.cardController.addCard)
    .get(card_controller_1.cardController.getCards);
router.get('/default', card_controller_1.cardController.getDefaultCard);
router
    .route('/:id')
    .put((0, zod_validation_middleware_1.validateRequest)(account_validation_1.cardSchema.partial()), card_controller_1.cardController.updateCard)
    .delete(card_controller_1.cardController.deleteCard);
router.post('/:id/set-default', card_controller_1.cardController.setDefaultCard);
exports.default = router;
