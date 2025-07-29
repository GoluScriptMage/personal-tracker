import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { response, valdidateResourceExists } from '../utils/DryFunction.js';
import { promisify } from 'util';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (res, token, statusCode, user) => {
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ), // Convert days into miliseconds
    httpOnly: true, // Prevents client-side JavaScript from accesing the cookie
  };

  user.password = undefined; // Removes password from the user object before sending it to the client
  user.confirmPassword = undefined; // Removes confirmPassword from the user object before sending it to the client

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // Ensures the cookie only sent to the https
  }

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    confirmPassword,
  });

  valdidateResourceExists(user, 'user', next, 'User creation failed!');

  const token = signToken(user._id);

  createSendToken(res, token, 201, user);
});

export const login = catchAsync(async (req, res, next) => {
  // Get the email and password from the req body
  const { email, password } = req.body;

  // Check the email and pass are ok
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // Check if the user exists and password is correct
  const user = await User.findOne({
    email,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // if everything ok find the user and send the token
  const token = signToken(user._id);
  createSendToken(res, token, 200, user);
});

export const protect = catchAsync(async (req, res, next) => {
  // check if the token exists to req headers
  if (
    !req.headers.authorization &&
    !req.headers.authorization.split(' ')[0].startsWith('Bearer')
  ) {
    return next(
      new AppError('You are not logged in Please log in to get access', 401),
    );
  }

  const token = req.headers.authorization.split(' ')[1];

  // decode the pass after checking the token validity
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  // Check if the user exists
  const user = await User.findById(decodedToken.id);
  valdidateResourceExists(user, 'user', next);

  // check if the pass has been changed using the changePassAfter
  if (
    user.changedPasswordAfter(decodedToken.iat) &&
    !user.isJWTExpired(decodedToken.exp)
  ) {
    return next(
      new AppError(
        'Password changed after token issued! Please log in again.',
        401,
      ),
    );
  }

  // if everything ok then return the user in the req object
  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  valdidateResourceExists(email, 'email', next, 'Email is required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = user.createResetToken();
  validateResourceExists(
    resetToken,
    'resetToken',
    next,
    'Failed to create reset token',
  );

  await user.save({ validateBeforeSave: false }); // Save the reset Token and it's expiry

  // send the reset token to user Email
});

// export const resetPassword = catchAsync( async (req, res, next) => {

// })
