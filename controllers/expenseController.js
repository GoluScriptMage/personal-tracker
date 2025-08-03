import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Expense from '../Models/expenseModel.js';
import { response, valdidateResourceExists } from '../utils/DryFunction.js';
import ApiFeatures from '../utils/apiFeatures.js';

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
  console.log('User id: ', req.user._id);

  // don't use await here bcz we need to send the query not the result
  const query = Expense.find({ user: req.user._id });

  const features = new ApiFeatures(query, req.query)
    .filter()
    .sort()
    .fields()
    .pagination();

  const userExpenses = await features.query;

  if (userExpenses.length < 1) {
    return next(new AppError('No expenses found for the user!', 404));
  }

  response(res, 200, 'Expenses retrieved successfully', userExpenses);
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
    return next(new AppError('Expense not found or not authorized!', 404));
  }

  const {
    expenseCategory = currentExpense.expenseCategory,
    expenseAmount = currentExpense.expenseAmount,
    expenseDescription = currentExpense.expenseDescription,
    date = currentExpense.date,
  } = req.body;

  const updatedExpense = await Expense.findByIdAndUpdate(
    id, // First: the ID we want to update
    {
      // Second: the fields to update
      expenseCategory,
      expenseAmount,
      expenseDescription,
      date,
      user: req.user._id,
    },
    {
      // Third: options
      new: true,
      runValidators: true,
    },
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
    user: req.user._id, // Use the logged-in user's ID
  });

  valdidateResourceExists(expense, 'expense', next);

  response(res, 201, 'Expense created successfully', expense);
});

// To sort the user expenses category-wise
export const sortUserExpenses = catchAsync(async (req, res, next) => {
  const aggregationPipeline = [
    {
      $match: { user: req.user._id },
    },
    {
      $group: {
        _id: '$expenseCategory',
        totalAmount: { $sum: '$expenseAmount' },
        totalExpenses: { $sum: 1 }, // Count the number of the expenses
        expenses: { $push: '$$ROOT' }, // Push the entire expense Amount
      },
    },
  ];

  const sortedExpenses = await Expense.aggregate(aggregationPipeline);

  if (sortedExpenses.length === 0) {
    return next(new AppError('No expenses found for the user!', 404));
  }
  response(
    res,
    200,
    'Expenses sorted by category successfully',
    sortedExpenses,
  );
});
