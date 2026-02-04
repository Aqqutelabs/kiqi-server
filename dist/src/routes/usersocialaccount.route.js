"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersocialaccount_controller_1 = require("../controllers/usersocialaccount.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const userSocialAccountRouter = express_1.default.Router();
userSocialAccountRouter.get("/", Auth_middlewares_1.isAuthenticated, usersocialaccount_controller_1.getUserSocialAccounts);
exports.default = userSocialAccountRouter;
