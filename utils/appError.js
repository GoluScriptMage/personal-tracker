class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.error = statusCode === 404 ? 'Not found' : 'Bad Request';

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
