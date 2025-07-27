const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const SendProdError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  // Define the status code and status if not defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Check for the error environment
  if (process.env.NODE_ENV === 'development') {
    // In development send error to the Send dev ErrorHandler
    return sendDevError(err, res);
  }
  //if environment is production then run this
  if (process.env.NODE_ENV === 'production') {
    //  In Production send error to the Send prod ErrorHandler
    return SendProdError(err, res);
  }
};

module.exports = globalErrorHandler;
