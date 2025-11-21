"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sms_controller_1 = require("../controllers/sms.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const uploadCsv_1 = __importDefault(require("../middlewares/uploadCsv"));
const router = (0, express_1.Router)();
const controller = new sms_controller_1.SmsController();
router.post('/sender', Auth_middlewares_1.isAuthenticated, controller.createSender);
router.get('/senders', Auth_middlewares_1.isAuthenticated, controller.getSenders);
router.put('/sender/:id', Auth_middlewares_1.isAuthenticated, controller.updateSender);
router.delete('/sender/:id', Auth_middlewares_1.isAuthenticated, controller.deleteSender);
router.post('/send', Auth_middlewares_1.isAuthenticated, controller.sendMessage);
router.post('/templates', Auth_middlewares_1.isAuthenticated, controller.createTemplate);
router.get('/templates', Auth_middlewares_1.isAuthenticated, controller.getTemplates);
router.get('/templates/:id', Auth_middlewares_1.isAuthenticated, controller.getTemplateById);
router.put('/templates/:id', Auth_middlewares_1.isAuthenticated, controller.updateTemplate);
router.delete('/templates/:id', Auth_middlewares_1.isAuthenticated, controller.deleteTemplate);
router.post('/templates/:id/send', Auth_middlewares_1.isAuthenticated, controller.sendTemplate);
router.post('/groups', Auth_middlewares_1.isAuthenticated, (req, res, next) => {
    uploadCsv_1.default.single('csv')(req, res, (err) => {
        if (err && err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'file') {
            uploadCsv_1.default.single('file')(req, res, next);
        }
        else if (err) {
            next(err);
        }
        else {
            next();
        }
    });
}, controller.createRecipientGroup);
router.get('/groups', Auth_middlewares_1.isAuthenticated, controller.getRecipientGroups);
router.put('/groups/:id', Auth_middlewares_1.isAuthenticated, controller.updateRecipientGroup);
router.delete('/groups/:id', Auth_middlewares_1.isAuthenticated, controller.deleteRecipientGroup);
router.post('/send', Auth_middlewares_1.isAuthenticated, controller.sendNow);
exports.default = router;
