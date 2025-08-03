import AppError from './appError.js';

export const response = (
  res,
  statusCode,
  message,
  data = null,
  status = 'success',
) => {
  res.status(statusCode).json({
    result: data ? data.length : 0,
    status: status,
    message: message,
    data: data || null,
  });
};

export const valdidateResourceExists = (
  data,
  type,
  next,
  msg = 'Invalid data',
) => {
  // Explicitly check for null, undefined, or empty array
  if (
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0)
  ) {
    switch (type) {
      case 'id': {
        return next(new AppError('User ID is required', 400));
      }
      case 'user': {
        return next(new AppError('User not found!', 404));
      }
      case 'expense': {
        return next(new AppError('No expense found!', 404));
      }
      default: {
        return next(new AppError(msg, 400));
      }
    }
  }
  return data; // Return the data if it exists
};
