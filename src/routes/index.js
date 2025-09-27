"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboarding_routes_1 = __importDefault(require("./onboarding.routes"));
const campaign_route_1 = __importDefault(require("./campaign.route"));
const senderEmail_routes_1 = __importDefault(require("./senderEmail.routes"));
const router = (0, express_1.Router)();
// router.use('/auth', authRouter);
router.use('/onboarding', onboarding_routes_1.default);
router.use('/campaigns', campaign_route_1.default);
router.use('/senders', senderEmail_routes_1.default);
exports.default = router;
