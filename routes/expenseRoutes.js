import express from 'express';
import {
  createExpense,
  deleteExpenses,
  getAllExpense,
  getExpense,
  sortUserExpenses,
  updateExpense,
} from '../controllers/expenseController.js';
import { protect, restrictTo, signup } from '../controllers/authController.js';

const router = express.Router();

// For only logged in user

// TO get the expense and create a new Expense
router.route('/').get(protect, getAllExpense).post(protect, createExpense);

// Expenses sorted based on category for logined in user
router.route('/categories').get(protect, sortUserExpenses);

router
  .route('/:id')
  .get(protect, getExpense) // Get the response by id
  .delete(protect, restrictTo('admin'), deleteExpenses) // To delete the expense
  .patch(protect, updateExpense); // To update the expense

export default router;
