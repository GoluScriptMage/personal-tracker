import mongoose from 'mongoose';
import User from '../Models/userModel.js';
import Expense from '../Models/expenseModel.js';

// Use the same database connection as in server.js
const dbURL = process.env.MONGODB_URL 
  ? process.env.MONGODB_URL.replace('<PASSWORD>', process.env.MONGODB_PASSWORD)
  : 'mongodb://localhost:27017/personal-tracker';

mongoose
  .connect(dbURL)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.log('Error connecting to DB:', err));

// Sample users data
const users = [
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'john.doe@example.com',
    password: 'password12345',
    confirmPassword: 'password12345',
    createdAt: new Date('2025-01-15')
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'jane.smith@example.com',
    password: 'securepass12345',
    confirmPassword: 'securepass12345',
    createdAt: new Date('2025-02-10')
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'mike.wilson@example.com',
    password: 'mikepass12345',
    confirmPassword: 'mikepass12345',
    createdAt: new Date('2025-03-05')
  }
];

// Sample expenses data
const expenses = [
  // User 1 Expenses (8 expenses)
  {
    expenseCategory: 'Food',
    expenseDescription: 'Grocery shopping at Whole Foods',
    expenseAmount: 85.75,
    date: new Date('2025-07-01'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Transport',
    expenseDescription: 'Monthly bus pass',
    expenseAmount: 45.00,
    date: new Date('2025-07-05'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Entertainment',
    expenseDescription: 'Movie tickets and popcorn',
    expenseAmount: 32.50,
    date: new Date('2025-07-10'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Utilities',
    expenseDescription: 'Electricity bill',
    expenseAmount: 75.20,
    date: new Date('2025-07-15'),
    user: users[0]._id
  },
  {
    expenseCategory: 'HealthCare',
    expenseDescription: 'Pharmacy - prescription medication',
    expenseAmount: 45.99,
    date: new Date('2025-07-18'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Food',
    expenseDescription: 'Dinner at Italian restaurant',
    expenseAmount: 65.30,
    date: new Date('2025-07-20'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Others',
    expenseDescription: 'Birthday gift for friend',
    expenseAmount: 50.00,
    date: new Date('2025-07-22'),
    user: users[0]._id
  },
  {
    expenseCategory: 'Transport',
    expenseDescription: 'Gas for car',
    expenseAmount: 42.75,
    date: new Date('2025-07-25'),
    user: users[0]._id
  },
  
  // User 2 Expenses (7 expenses)
  {
    expenseCategory: 'Food',
    expenseDescription: 'Weekly groceries',
    expenseAmount: 120.45,
    date: new Date('2025-07-02'),
    user: users[1]._id
  },
  {
    expenseCategory: 'Transport',
    expenseDescription: 'Uber rides',
    expenseAmount: 35.80,
    date: new Date('2025-07-07'),
    user: users[1]._id
  },
  {
    expenseCategory: 'Entertainment',
    expenseDescription: 'Concert tickets',
    expenseAmount: 95.00,
    date: new Date('2025-07-12'),
    user: users[1]._id
  },
  {
    expenseCategory: 'Utilities',
    expenseDescription: 'Internet bill',
    expenseAmount: 59.99,
    date: new Date('2025-07-16'),
    user: users[1]._id
  },
  {
    expenseCategory: 'Food',
    expenseDescription: 'Lunch with colleagues',
    expenseAmount: 28.75,
    date: new Date('2025-07-19'),
    user: users[1]._id
  },
  {
    expenseCategory: 'HealthCare',
    expenseDescription: 'Dentist appointment',
    expenseAmount: 150.00,
    date: new Date('2025-07-21'),
    user: users[1]._id
  },
  {
    expenseCategory: 'Others',
    expenseDescription: 'Home office supplies',
    expenseAmount: 85.50,
    date: new Date('2025-07-24'),
    user: users[1]._id
  },
  
  // User 3 Expenses (5 expenses)
  {
    expenseCategory: 'Food',
    expenseDescription: 'Takeout dinner',
    expenseAmount: 22.95,
    date: new Date('2025-07-03'),
    user: users[2]._id
  },
  {
    expenseCategory: 'Entertainment',
    expenseDescription: 'Gaming subscription',
    expenseAmount: 14.99,
    date: new Date('2025-07-08'),
    user: users[2]._id
  },
  {
    expenseCategory: 'Utilities',
    expenseDescription: 'Water bill',
    expenseAmount: 38.50,
    date: new Date('2025-07-14'),
    user: users[2]._id
  },
  {
    expenseCategory: 'Transport',
    expenseDescription: 'Car maintenance',
    expenseAmount: 210.75,
    date: new Date('2025-07-17'),
    user: users[2]._id
  },
  {
    expenseCategory: 'HealthCare',
    expenseDescription: 'Gym membership',
    expenseAmount: 65.00,
    date: new Date('2025-07-23'),
    user: users[2]._id
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    // await User.deleteMany({});
    // await Expense.deleteMany({});
    
    // Create new users
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users created successfully!`);
    console.log('Database used:', mongoose.connection.db.databaseName);
    
    // Create new expenses
    const createdExpenses = await Expense.create(expenses);
    console.log(`${createdExpenses.length} expenses created successfully!`);
    
    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    // Show detailed validation errors if available
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.error(`Validation error in field '${field}':`, error.errors[field].message);
      });
    }
    if (error.code === 11000) {
      console.error('Duplicate key error - you may be trying to insert a user with an email that already exists');
    }
  } finally {
    // Close connection after seeding
    mongoose.connection.close();
  }
};

// Run the seed function
seedDatabase();
