import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import userRouter from './routes/userRoutes.js';
import expenseRouter from './routes/expenseRoutes.js';
import AppError from './utils/appError.js';

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use(helmet());

app.use('/api/v1/user', userRouter);
app.use('/api/v1/expense', expenseRouter);

// Defining a universal error handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find this URL ${req.originalUrl}.`, 404));
});

export default app;