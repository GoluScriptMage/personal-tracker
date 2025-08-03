import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({
  path: './.config.env',
});

const dbURL = process.env.MONGODB_URL.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD,
);

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception Shutting down...');
  console.error(err.name, err.message);
  process.exit(1); // Exit with failure
});

mongoose
  .connect(dbURL)
  .then(() => {
    console.log('Connected to MongoDB');
  });

console.log(`${process.env.NODE_ENV} mode `);

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1); // Exit after server closes
  });
});
