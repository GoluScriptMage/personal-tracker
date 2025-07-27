const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseCategory: {
    type: String,
    enum: {
      values: [
        'Food',
        'Transport',
        'Entertainment',
        'Utilities',
        'HealthCare',
        'Others',
      ],
      message: 'Expense type is not valid',
    },
    required: [true, 'Expense type is required'],
  },
  expenseAmount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Expense amount must be positive'],
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
