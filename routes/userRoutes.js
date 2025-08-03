import express from 'express';
import {
  getAllUsers,
  createUser,
  getUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

// To get the all user profile and create a new user
router.route('/').get(getAllUsers).post(createUser);

// To update the user profile and delete the user and get the user
router
  .route('/:id')
  .get(restrictTo('admin'), getUser)
  .delete(restrictTo('admin'), deleteUser)
  .patch(restrictTo('admin'), () => {});

export default router;
