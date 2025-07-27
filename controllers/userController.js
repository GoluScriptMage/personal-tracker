import catchAsync from '../utils/catchAsync.js';
import User from '../Models/userModel.js';

// To get the user
// export const getUser = catchAsync (async(req, res, next) => {

// })

// To get all user

// To delete the user

// To update the user

// To create new user
const createUser = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  const user = await User.create({
    email,
    password,
    confirmPassword,
  });

  res.status(201).json({
    status: 'Success',
    message: 'User created Successfully',
    data: {
      user,
    },
  });
});

export default createUser;
