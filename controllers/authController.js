import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { response, valdidateResourceExists } from '../utils/DryFunction.js';
import { promisify } from 'util';
import sendEmail from '../utils/emails/SendEmail.js';
import crypto from 'crypto';

// Function to sign the JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Function to set the jwt token in the cookie
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

//  Signup function to create a new user
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

// To login the user
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

//  To cofirm the user is logged in or had jwt
export const protect = catchAsync(async (req, res, next) => {
  // check if the token exists in req headers
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401),
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
    user.changePasswordAfter(decodedToken.iat) &&
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

// To restict the user to specific roles
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

// To frogot password and send reset token to user email
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  valdidateResourceExists(email, 'email', next, 'Email is required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = user.createResetToken();
  valdidateResourceExists(
    resetToken,
    'resetToken',
    next,
    'Failed to create reset token',
  );

  await user.save({ validateBeforeSave: false }); // Save the reset Token and it's expiry

  // send the reset token to user Email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  const message = `Forgot your password? Reset it here: ${resetURL}`;

  console.log('Reset Token:', resetToken);

  const options = {
    email: user.email,
    subject: 'Your password reset token (valid for 10 min)',
    message,
    resetURL,
  };

  try {
    // Sent the email
    await sendEmail(options);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

// To reset the password using the reset token
export const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  valdidateResourceExists(
    hashedToken,
    'resetToken',
    next,
    'Reset token is required',
  );

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(), // Check if the token has not expired
    },
  }).select('+passwordResetExpires +passwordResetToken');

  console.log('User found:', user);

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update the user Password, passwordChangedAt and save it
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.passwordChangedAt = Date.now();
  // we Don’t need to bcrypt pass it will be done in the userModel pre save hook

  const updatedUser = await user.save(); // save the updated password;

  const jwtToken = signToken(updatedUser._id);

  createSendToken(res, jwtToken, 200);
});

// To logout the user
export const logout = catchAsync(async (req, res, next) => {
  // Clear the jwt token in the cookie
  res.cookie('jwt', 'loggedOut', {
    expiresIn: new Date(Date.now() + 10 * 1000), // Set a short expiry time
    httpOnly: true, // Prevent client side access
  });

  response(res, 200, 'Logged Out Successfully');
});

// To verify the user email (email verification) --- (via frontend)
export const emailVerifyTokenSend = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new AppError('User not found!', 404));
  }

  // Create the emailVerification token and save the hashed -v in dbURL
  const emailVerifyToken = user.createResetToken();

  const hashedToken = crypto
    .createHash('sha256')
    .update(emailVerifyToken)
    .digest('hex');

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry for token

  // Save them to the user
  await user.save({ validateBeforeSave: false });

  // create the message and url
  const reqUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${emailVerifyToken}`;
  const message = `Please verify your email by clicking on the following link: ${reqUrl}`;

  // Send it to user email
  const options = {
    email: user.email,
    subject: 'Email Verification Token',
    message,
  };

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Sending verification email to ${user.email}`);
      console.log('Email Verification Token:', emailVerifyToken);
    }
    await sendEmail(options);
    response(
      res,
      200,
      'Verification email sent successfully. Please check your inbox.',
    );
  } catch {
    user.emailVerificationExpires = undefined;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Failed to send verification email:', error);
    return next(
      new AppError(
        'Failed to send verification email. Please try again later.',
        500,
      ),
    );
  }
});

// To verify that user is verified or not (via post req)
export const emailTokenVerify = catchAsync(async (req, res, next) => {
  // Get the token and verify its validity
  const { token } = req.params;
  valdidateResourceExists(
    token,
    'token',
    next,
    'Verification token is required',
  );

  // Find the user using the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: {
      $gt: Date.now(), // Check if the token has not expired
    },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // update the user isVerified to true
  user.isVerified = true;
  user.emailVerificationExpires = undefined;
  user.emailVerificationToken = undefined;

  // save it to the user and  send response
  await user.save({ validateBeforeSave: false });
  response(res, 200, 'Email verified successfully', user);
});
