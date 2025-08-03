import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email address',
    },
    unique: true,
    // index: true, // Index for faster lookups
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
    select: false, // Do not return the confirmPassword in queries
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

// MiddleWares

// Password cryption
userSchema.pre('save', async function (next) {
  // Only run this if password is actually modified
  if (!this.isModified('password')) return next();

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
  this.confirmPassword = undefined; // Removes the confirmPassword
  return next();
});

// To check if the entered password matches the hashed password
userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

// To check if the password chnaged after the jwt issued
userSchema.methods.changePasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000; // convert to seconds
    return jwtTimeStamp < changedTimeStamp; // True only then passsword changed after jwt issued
  }
  return false; //  If passwordChangedAt is not set, it means password has not been changed
};

// To check if the jwt is expired or not
userSchema.methods.isJWTExpired = function (jwtExpires) {
  return Date.now() >= jwtExpires * 1000;
};

// Create the reset token save the hased -v to db and return non hased -v
userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Indexes for faster lookups
userSchema.index({
  passwordResetToken: 1,
  passwordResetExpires: 1,
}); // For password reset token and expiration both together lookups
userSchema.index({
  createdAt: -1,
}); // -1 for descending order and created at for the User date of creation

const User = mongoose.model('User', userSchema);

export default User;
