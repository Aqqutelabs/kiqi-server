
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

export default senderRouter;
