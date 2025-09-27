"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Onboarding_controller_1 = require("../controllers/Onboarding.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
// All onboarding routes should be protected
router.use(Auth_middlewares_1.verifyJWT);
router.route('/connect-wordpress').post(validation_middleware_1.wordpressValidator, Onboarding_controller_1.connectWordpress);
router.route('/customize-chatbot').post(validation_middleware_1.chatbotValidator, Onboarding_controller_1.customizeChatbot);
exports.default = router;
