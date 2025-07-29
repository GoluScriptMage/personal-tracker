import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Expense from '../Models/expenseModel.js';
import { response, valdidateResourceExists } from '../utils/DryFunction.js';

// To get the expense
export const getExpense = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  valdidateResourceExists(id, 'id', next);

  const expense = await Expense.findById(id);
  if (!expense) {
    return next(new AppError('Expense not found!', 404));
  }

  response(res, 200, 'Expense retrieved successfully', expense);
});

// To get all expense
export const getAllExpense = catchAsync(async (req, res, next) => {
  const expenses = await Expense.find();
  valdidateResourceExists(expenses.length > 0, 'expense', next);
  response(res, 200, 'Expenses retrieved successfully', expenses);
});

// To delete the expense
export const deleteExpenses = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  valdidateResourceExists(id, 'id', next);

  await Expense.findByIdAndDelete(id);
  res.status(204).end();
});

// To update the expense
export const updateExpense = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  valdidateResourceExists(id, 'id', next);

  const currentExpense = await Expense.findById(id);
  if (!currentExpense) {
    return next(new AppError('Expense not found!', 404));
  }

  const {
    expenseCategory = currentExpense.expenseCategory,
    expenseAmount = currentExpense.expenseAmount,
    expenseDescription = currentExpense.expenseDescription,
    date = currentExpense.date,
  } = req.body;

  const updatedExpense = await Expense.findByIdAndUpdate(
    id,    // First: the ID we want to update
    {      // Second: the fields to update
      expenseCategory,
      expenseAmount,
      expenseDescription,
      date,
      userId: currentExpense.userId,
    },
    {      // Third: options
      new: true,
      runValidators: true,
    }
  );

  response(res, 200, 'Expense updated successfully', updatedExpense);
});

// To create new expense
export const createExpense = catchAsync(async (req, res, next) => {
  const { expenseCategory, expenseDescription, expenseAmount, date, userId } =
    req.body;

  const expense = await Expense.create({
    expenseCategory,
    expenseDescription,
    expenseAmount,
    date,
    userId,
  });

  valdidateResourceExists(expense, 'expense', next);

  response(res, 201, 'Expense created successfully', expense);
});
