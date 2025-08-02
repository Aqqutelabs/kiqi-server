import express from "express"
import { AuthController } from "../controllers/auth.controller";


const authController = new AuthController();
const authRoutes = express.Router()

authRoutes.post("/login", authController.login)

authRoutes.post(
  "/register",
  authController.createUser
);


export default authRoutes