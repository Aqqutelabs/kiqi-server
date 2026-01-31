"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const senderEmail_controller_1 = require("../controllers/senderEmail.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const senderRouter = (0, express_1.Router)();
const controller = new senderEmail_controller_1.SenderEmailController();
senderRouter.post('/sendgrid/request-verification', Auth_middlewares_1.isAuthenticated, controller.requestSendGridVerification);
senderRouter.post('/sendgrid/confirm-verification', Auth_middlewares_1.isAuthenticated, controller.confirmSendGridVerification);
senderRouter.get('/sendgrid/verified-sender', Auth_middlewares_1.isAuthenticated, controller.getUserVerifiedSender);
senderRouter.get('/sendgrid/verified-senders', Auth_middlewares_1.isAuthenticated, controller.getUserVerifiedSenders);
senderRouter.get('/sendgrid/all-verified-senders', Auth_middlewares_1.isAuthenticated, controller.getAllVerifiedSenders);
senderRouter.post("/", Auth_middlewares_1.isAuthenticated, controller.createSenderEmail);
senderRouter.get("/", Auth_middlewares_1.isAuthenticated, controller.getAllSenderEmails);
senderRouter.get("/:id", Auth_middlewares_1.isAuthenticated, controller.getSenderEmailById);
senderRouter.put("/:id", Auth_middlewares_1.isAuthenticated, controller.updateSenderEmail);
senderRouter.delete("/:id", Auth_middlewares_1.isAuthenticated, controller.deleteSenderEmail);
// OTP verification endpoints
// OTP verification flow removed — SendGrid verification endpoints are used instead
// SendGrid verified sender endpoints
// senderRouter.post("/verify", isAuthenticated, controller.verifySender);
exports.default = senderRouter;
