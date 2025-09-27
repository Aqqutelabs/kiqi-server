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
// import errorHandler from './middlewares/errorHandler.middleware';
dotenv_1.default.config();
(0, ConnectDB_1.default)();
(0, GoogleAI_1.GoogleAI)();
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Serve uploaded files statically
app.use(`/${index_1.default.uploadDir}`, express_1.default.static(index_1.default.uploadDir));
// API Routes
app.get('/', (req, res) => {
    res.status(200).json({ message: 'KiQi Backend is running!' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/v1', index_2.default);
app.use("/api/v1/senderEmail", senderEmail_routes_1.default);
app.use("/api/v1/auth", auth_route_1.default);
app.use("/api/v1/templates", templates_route_1.default);
app.use("/api/v1/ai", googeAi_route_1.default);
app.use("/api/v1/campaigns", campaign_route_1.default);
app.use("/api/v1/email-lists", emailList_route_1.default);
// app.use("/api/settings")
// app.use("/api/mailChat")
app.use(ErrorHandler_1.default);
// Start the server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
