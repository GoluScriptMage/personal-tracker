import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import userRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';
import expenseRouter from './routes/expenseRoutes.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3173', // React app address
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}))

app.use('/api/v1/user', userRouter);
app.use('/api/v1/expense', expenseRouter);
app.use('/api/v1/auth', authRouter);

// Defining a universal error handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find this URL ${req.originalUrl}.`, 404));
});


// Global error handling middleware - must be after all other middleware and routes
app.use(globalErrorHandler);



export default app;
