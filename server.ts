// src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import errorHandler from './src/middlewares/ErrorHandler';
import config from './src/config/index';
import mainRouter from './src/routes/index';
import senderRouter from './src/routes/senderEmail.routes';
import authRoutes from './src/routes/auth.route';
import connectDB from './src/config/ConnectDB';
// import errorHandler from './middlewares/errorHandler.middleware';

connectDB()

// Initialize express app
const app: Express = express();

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

// Global Error Handler Middleware (must be last)
// app.use(errorHandler);

// Start the server
app.listen(config.port, () => {
  console.log(`[server]: Server is running at http://localhost:${config.port}`);
});