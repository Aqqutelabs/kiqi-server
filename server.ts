// src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import errorHandler from './src/middlewares/ErrorHandler';
import config from './src/config/index';
import mainRouter from './src/routes/index';
import senderRouter from './src/routes/senderEmail.routes';
import authRoutes from './src/routes/auth.route';
import connectDB from './src/config/ConnectDB';
import { GoogleAI } from './src/config/GoogleAI';
import templateRouter from './src/routes/templates.route';
import googleAIrouter from './src/routes/googeAi.route';
import campaignRoute from './src/routes/campaign.route';
import emailListRoute from './src/routes/emailList.route';
import dotenv from 'dotenv';
import { verifyJWT } from './src/middlewares/Auth.middlewares';
import { AuthController } from './src/controllers/auth.controller';
// import errorHandler from './middlewares/errorHandler.middleware';

dotenv.config()
connectDB()
GoogleAI()

// Initialize express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use(`/${config.uploadDir}`, express.static(config.uploadDir));


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'KiQi Backend is running!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Initialize controller after app is created
const authController = new AuthController();

// Direct sender route for testing
app.put('/api/v1/sender', verifyJWT, (req: Request, res: Response, next: NextFunction) => {
  console.log('Sender route hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('User from JWT:', req.user);
  
  authController.updateSenderEmail(req, res, next);
});


// Mount all routes under /api/v1
app.use("/api/v1/auth", authRoutes);

// Then other specific routes
app.use("/api/v1/senderEmail", senderRouter);
app.use("/api/v1/templates", templateRouter);
app.use("/api/v1/ai", googleAIrouter);
app.use("/api/v1/campaigns", campaignRoute);
app.use("/api/v1/email-lists", emailListRoute);

// Then the main router last for any remaining routes
app.use('/api/v1', mainRouter);
// app.use("/api/settings")
// app.use("/api/mailChat")

app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});