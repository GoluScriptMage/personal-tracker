import express from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  emailTokenVerify,
  protect,
  emailVerifyTokenSend,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup); // To Signup user
router.post('/login', login); // To Login User

router.post('/forgot-password', forgotPassword); // To handle forgot password
router.post('/reset-password/:token', resetPassword); // To reset password

router.post('/email-token-send', protect, emailVerifyTokenSend); // To verify email via token
router.post('/email-token-verify/:token', emailTokenVerify);

export default router;
