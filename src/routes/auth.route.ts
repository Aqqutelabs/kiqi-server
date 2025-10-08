import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/Auth.middlewares";

const authController = new AuthController();
const authRoutes = express.Router();

// Debug middleware
authRoutes.use((req, res, next) => {
  console.log('Auth Route - Method:', req.method);
  console.log('Auth Route - Path:', req.path);
  next();
});

authRoutes.post("/login", authController.login);
authRoutes.post("/register", authController.createUser);


export default authRoutes;