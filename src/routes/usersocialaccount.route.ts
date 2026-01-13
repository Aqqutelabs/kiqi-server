import express from "express";
import { getUserSocialAccounts } from "../controllers/usersocialaccount.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";

const userSocialAccountRouter = express.Router();

userSocialAccountRouter.get("/", isAuthenticated, getUserSocialAccounts);

export default userSocialAccountRouter;
