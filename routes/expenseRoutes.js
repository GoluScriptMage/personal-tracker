import express from 'express';

const router = express.Router();

// TO get the expense and create a new Expense
router
  .route('/')
  .get(() => {})
  .post(() => {});

// To update the expense and delete the Expense
router
  .route('/:id')
  .delete(() => {})
  .patch(() => {});

export default router;
