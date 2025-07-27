import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email address',
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters long'],
    maxLength: [32, 'Password must be at most 32 characters long'],
  },
  confirmPassword: {
    type: String,
    required: [true, 'Confirm Password is required'],
    minLength: [8, 'Confirm Password must be at least 8 characters long'],
    maxLength: [32, 'Confirm Password must be at most 32 characters long'],
    validate: {
      validator: function (pass) {
        return this.password === pass;
      },
      message: 'Passwords do not match',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: {
    type: Date,
  },
});

const User = mongoose.model('User', userSchema);
export default User;
