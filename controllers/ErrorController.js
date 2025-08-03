import AppError from '../utils/appError.js';

// handle validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid data input. ${errors.join('\n')}`;
  return new AppError(message, 400);
};

// handle duplicate key error
const handleDuplicateKeyError = (err) => {
  const message = `Duplicate field values: ${Object.keys(err.keyValue)[0]}: ${Object.values(err.keyValue)[0]}.`;
  return new AppError(message, 400);
};

// JSON web token error
const handleJsonWebTokenError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
}

// Send error in the development environment
const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errors: err.errors || err,
    stack: err.stack,
  });
};

// Send error in the production environment
const SendProdError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status || 'error',
    message: err.message,
  });
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  // Define the status code and status if not defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Check for the error environment
  if (process.env.NODE_ENV === 'development') {
    return sendDevError(err, res);
  }
  if (process.env.NODE_ENV === 'production') {
    let error = err; // Use the original error object
    console.log(`Error 💥`, error.code);
    
    if (error.message && error.message.includes('Validation failed')) {
      error = handleValidationError(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateKeyError(error);
      console.log(error);
    }
    if (error.name === 'JsonWebTokenError'){
      error = handleJsonWebTokenError(error)
    }

    return SendProdError(error, res);
  }
};

export default globalErrorHandler;
