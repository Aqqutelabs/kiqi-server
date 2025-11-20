import { Router } from "express";
import { SenderEmailController } from "../controllers/senderEmail.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";

const senderRouter = Router();
const controller = new SenderEmailController();

senderRouter.post("/", isAuthenticated, controller.createSenderEmail);
senderRouter.get("/", isAuthenticated, controller.getAllSenderEmails);
senderRouter.get("/:id", isAuthenticated, controller.getSenderEmailById);
senderRouter.put("/:id", isAuthenticated, controller.updateSenderEmail);
senderRouter.delete("/:id", isAuthenticated, controller.deleteSenderEmail);
// OTP verification endpoints
// OTP verification flow removed — SendGrid verification endpoints are used instead
// SendGrid verified sender endpoints
senderRouter.post('/sendgrid/request-verification', isAuthenticated, controller.requestSendGridVerification);
senderRouter.post('/sendgrid/confirm-verification', isAuthenticated, controller.confirmSendGridVerification);
senderRouter.get('/sendgrid/verified-sender', isAuthenticated, controller.getUserVerifiedSender);

// senderRouter.post("/verify", isAuthenticated, controller.verifySender);

export default senderRouter;
