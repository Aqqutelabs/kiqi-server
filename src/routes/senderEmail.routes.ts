
import { Router } from "express";
import { SenderEmailController } from "../controllers/senderEmail.controller";

const senderRouter = Router();
const controller = new SenderEmailController();

senderRouter.post("/", controller.createSenderEmail);
senderRouter.get("/", controller.getAllSenderEmails);
senderRouter.get("/:id", controller.getSenderEmailById);
senderRouter.put("/:id", controller.updateSenderEmail);
senderRouter.delete("/:id", controller.deleteSenderEmail);

export default senderRouter;
