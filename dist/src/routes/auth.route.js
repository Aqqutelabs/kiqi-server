"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const authController = new auth_controller_1.AuthController();
const authRoutes = express_1.default.Router();
// Debug middleware
authRoutes.use((req, res, next) => {
    console.log('Auth Route - Method:', req.method);
    console.log('Auth Route - Path:', req.path);
    next();
});
authRoutes.post("/login", authController.login);
authRoutes.post("/register", authController.createUser);
<<<<<<< HEAD
authRoutes.post('/google', authController.googleSignIn);
authRoutes.post('/google/callback', auth_controller_1.getGoogleTokens);
authRoutes.get('/google/callback', auth_controller_1.getGoogleTokens);
=======
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
exports.default = authRoutes;
