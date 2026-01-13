import { Router } from "express";
import { EmailListController } from "../controllers/emailList.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import uploadCsv from '../middlewares/uploadCsv';

const emailListRoute = Router()
const emailListController = new EmailListController()

emailListRoute.post("/", isAuthenticated, uploadCsv.single('csv'), emailListController.createEmailList)
emailListRoute.get("/", isAuthenticated, emailListController.getAllEmailLists)
emailListRoute.get("/:id", isAuthenticated, emailListController.getEmailList)
emailListRoute.post("/:id/contacts", isAuthenticated, emailListController.addEmailListContacts)
emailListRoute.get("/contacts", isAuthenticated, emailListController.getAllContacts)
emailListRoute.delete("/:id/contacts/:contactId/delete", isAuthenticated, emailListController.deleteEmailListContact)
emailListRoute.delete("/:id", isAuthenticated, emailListController.deleteEmailList)
emailListRoute.get("/user/me", isAuthenticated, emailListController.getEmailListsByUser)

export default emailListRoute;