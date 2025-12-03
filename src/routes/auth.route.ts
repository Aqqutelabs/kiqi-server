import express from "express";
import { AuthController, getGoogleTokens } from "../controllers/auth.controller";
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
authRoutes.post('/google', authController.googleSignIn);
authRoutes.post('/google/callback', getGoogleTokens);
authRoutes.get('/google/callback', getGoogleTokens);
authRoutes.post('/wallet/signup', authController.walletSignup);

export default authRoutes;