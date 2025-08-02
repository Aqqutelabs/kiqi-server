import { Router } from "express";
import { EmailListController } from "../controllers/emailList.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";

const emailListRoute = Router()
const emailListController = new EmailListController()

emailListRoute.post("/", isAuthenticated, emailListController.createEmailList)
emailListRoute.get("/", isAuthenticated, emailListController.getAllEmailLists)
emailListRoute.get("/:id", isAuthenticated, emailListController.getEmailList)

export default emailListRoute;