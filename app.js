import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

import userRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';
import expenseRouter from './routes/expenseRoutes.js';

import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

const app = express();

// Parses the json and make the data available in the req.body
app.use(express.json());

// Logs the requests in the development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limits the requests no. for the routes
const authLimiter = rateLimit({
  windowMs: 15 * 50 * 1000, // 15 Minutes
  max: 10, // Limit rate to 10 req per windowMs
  message: 'TOo many Requests from this IP, please try again later.',
});

// Security headers
app.use(
   express.json({
    limit: '10kb',
  }),
);

// Set security http headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  }),
);

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter polluting
app.use(
  hpp({
    whiteList: ['amount', 'category', 'date', 'sortBy', 'limit', 'page'],
  }),
);

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3173', // React app address
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

// Routes 
app.use('/api/v1/user', authLimiter, userRouter);
app.use('/api/v1/expense', authLimiter, expenseRouter);
app.use('/api/v1/auth', authLimiter, authRouter);

// Defining a universal error handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find this URL ${req.originalUrl}.`, 404));
});

// Global error handling middleware - must be after all other middleware and routes
app.use(globalErrorHandler);
//  hello
export default app;
