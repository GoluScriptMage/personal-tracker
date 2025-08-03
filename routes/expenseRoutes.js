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

// TO get the expense and create a new Expense
router.route('/').get(protect, getAllExpense).post(protect, createExpense);

// Top high amount of expense
router.route('/categories').get(protect, sortUserExpenses);

// To update the expense and delete the Expense
router
  .route('/:id')
  .get(protect, getExpense)
  .delete(protect, restrictTo('admin'), deleteExpenses)
  .patch(protect, updateExpense);

export default router;
