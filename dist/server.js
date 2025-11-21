"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ErrorHandler_1 = __importDefault(require("./src/middlewares/ErrorHandler"));
const index_1 = __importDefault(require("./src/config/index"));
const index_2 = __importDefault(require("./src/routes/index"));
const senderEmail_routes_1 = __importDefault(require("./src/routes/senderEmail.routes"));
const auth_route_1 = __importDefault(require("./src/routes/auth.route"));
const ConnectDB_1 = __importDefault(require("./src/config/ConnectDB"));
const GoogleAI_1 = require("./src/config/GoogleAI");
const templates_route_1 = __importDefault(require("./src/routes/templates.route"));
const googeAi_route_1 = __importDefault(require("./src/routes/googeAi.route"));
const campaign_route_1 = __importDefault(require("./src/routes/campaign.route"));
const emailList_route_1 = __importDefault(require("./src/routes/emailList.route"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_controller_1 = require("./src/controllers/auth.controller");
// import errorHandler from './middlewares/errorHandler.middleware';
dotenv_1.default.config();
(0, ConnectDB_1.default)();
(0, GoogleAI_1.GoogleAI)();
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Serve uploaded files statically
app.use(`/${index_1.default.uploadDir}`, express_1.default.static(index_1.default.uploadDir));
app.get('/', (req, res) => {
    res.status(200).json({ message: 'KiQi Backend is running!' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
// Initialize controller after app is created
const authController = new auth_controller_1.AuthController();
// Direct sender route for testing
// app.put('/api/v1/sender', verifyJWT, (req: Request, res: Response, next: NextFunction) => {
//   console.log('Sender route hit');
//   console.log('Headers:', req.headers);
//   console.log('Body:', req.body);
//   console.log('User from JWT:', req.user);
//   authController.updateSenderEmail(req, res, next);
// });
// Mount all routes under /api/v1
app.use("/api/v1/auth", auth_route_1.default);
// Then other specific routes
// Mount sender router. Keep the original mount for backward compatibility
// app.use("/api/v1/senderEmail", senderRouter);
// Also mount hyphenated and plural aliases so deployed clients using
// `/api/v1/sender-emails` or `/api/v1/senders` continue to work.
// app.use("/api/v1/sender-emails", senderRouter);
app.use("/api/v1/senders", senderEmail_routes_1.default);
app.use("/api/v1/templates", templates_route_1.default);
app.use("/api/v1/ai", googeAi_route_1.default);
app.use("/api/v1/campaigns", campaign_route_1.default);
app.use("/api/v1/email-lists", emailList_route_1.default);
// Then the main router last for any remaining routes
app.use('/api/v1', index_2.default);
// app.use("/api/settings")
// app.use("/api/mailChat")
app.use(ErrorHandler_1.default);
// Start the server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
