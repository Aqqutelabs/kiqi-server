"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailList_controller_1 = require("../controllers/emailList.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const uploadCsv_1 = __importDefault(require("../middlewares/uploadCsv"));
const emailListRoute = (0, express_1.Router)();
const emailListController = new emailList_controller_1.EmailListController();
emailListRoute.post("/", Auth_middlewares_1.isAuthenticated, uploadCsv_1.default.single('csv'), emailListController.createEmailList);
emailListRoute.get("/", Auth_middlewares_1.isAuthenticated, emailListController.getAllEmailLists);
emailListRoute.get("/:id", Auth_middlewares_1.isAuthenticated, emailListController.getEmailList);
emailListRoute.post("/:id/contacts", Auth_middlewares_1.isAuthenticated, emailListController.addEmailListContacts);
emailListRoute.get("/contacts", Auth_middlewares_1.isAuthenticated, emailListController.getAllContacts);
emailListRoute.delete("/:id/contacts/:contactId/delete", Auth_middlewares_1.isAuthenticated, emailListController.deleteEmailListContact);
emailListRoute.get("/user/me", Auth_middlewares_1.isAuthenticated, emailListController.getEmailListsByUser);
exports.default = emailListRoute;
