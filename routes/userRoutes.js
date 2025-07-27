import express from 'express';
import createUser from '../controllers/userController.js';

const router = express.Router();

// To get the all user profile and create a new user
router
  .route('/')
  .get(() => {})
  .post(createUser);

// To update the user profile and delete the user and get the user
router
  .route('/:id')
  .get(() => {})
  .delete(() => {})
  .patch(() => {});

export default router;
