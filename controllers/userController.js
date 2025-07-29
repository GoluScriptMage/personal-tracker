import catchAsync from '../utils/catchAsync.js';
import User from '../Models/userModel.js';
import AppError from '../utils/appError.js';
import { response, valdidateResourceExists } from '../utils/DryFunction.js';

// To get the user
export const getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  response(res, 200, 'User retrieved successfully', user);
});

// To get all user
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  valdidateResourceExists(users.length > 0, 'user', next);

  response(res, 200, 'Users retrieved successfully', users);
});

// To delete the user
export const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  res.status(204).end();
});

// To update the user
// export const updateUserEmail = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   if (!id) return next(new AppError('User ID is required', 400));

//   const { email } = req.
// })

// To create new user
export const createUser = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  const user = await User.create({
    email,
    password,
    confirmPassword,
  });

  response(res, 201, 'User created successfully', user);
});
