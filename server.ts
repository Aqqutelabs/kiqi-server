// src/index.ts
import express, { Express, Request, Response } from 'express';
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
// import errorHandler from './middlewares/errorHandler.middleware';


dotenv.config()
connectDB()
GoogleAI()


// Initialize express app
const app: Express = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use(`/${config.uploadDir}`, express.static(config.uploadDir));


// API Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'KiQi Backend is running!' });
});


app.use('/api/v1', mainRouter);
app.use("/api/v1/senderEmail", senderRouter)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/templates", templateRouter)
app.use("/api/v1/ai", googleAIrouter)
app.use("/api/v1/campaigns", campaignRoute)
app.use("/api/v1/email-lists", emailListRoute)
// app.use("/api/settings")
// app.use("/api/mailChat")


app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});