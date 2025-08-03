import express from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup); // To Signup user
router.post('/login', login); // To Login User

router.post('/forgot-password', forgotPassword); // To handle forgot password
router.post('/reset-password/:token', resetPassword); // To reset password

export default router;
