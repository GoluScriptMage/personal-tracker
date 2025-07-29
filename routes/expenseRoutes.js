import express from 'express';
import {
  createExpense,
  deleteExpenses,
  getAllExpense,
  getExpense,
  updateExpense,
} from '../controllers/expenseController.js';
import { signup } from '../controllers/authController.js';

const router = express.Router();

// TO get the expense and create a new Expense
router.route('/').get(getAllExpense).post(createExpense);


// To update the expense and delete the Expense
router
  .route('/:id')
  .get(getExpense)
  .delete(deleteExpenses)
  .patch(updateExpense);

export default router;
