# Complete Guide: Connecting Your Node.js Backend to React Frontend

## Introduction

When building modern web applications, we typically separate our code into two main parts:

1. **Backend (Node.js)**: Handles data storage, authentication, business logic, and API endpoints
2. **Frontend (React)**: Creates the user interface and interacts with the backend

This guide will walk you through connecting these two parts step-by-step, with detailed explanations and examples specifically tailored to your Personal Tracker application.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Setting Up Your Backend for Frontend Integration](#setting-up-your-backend-for-frontend-integration)
3. [Building Your React Frontend](#building-your-react-frontend)
4. [Making API Calls from React to Node.js](#making-api-calls-from-react-to-nodejs)
5. [Authentication Implementation](#authentication-implementation)
6. [Handling Protected Routes](#handling-protected-routes)
7. [State Management in React](#state-management-in-react)
8. [Deployment Considerations](#deployment-considerations)
9. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Core Concepts

### Client-Server Architecture

```
┌──────────────┐         ┌──────────────┐
│              │  HTTP   │              │
│    React     │ ◄─────► │   Node.js    │
│  (Browser)   │ Requests│   (Server)   │
│              │         │              │
└──────────────┘         └──────────────┘
```

Your React application runs in the user's browser, while your Node.js backend runs on a server. They communicate via HTTP requests.

### RESTful APIs

REST (Representational State Transfer) is a style of API design where you create endpoints that use HTTP methods:

- `GET`: Retrieve data
- `POST`: Create new data
- `PUT`/`PATCH`: Update existing data
- `DELETE`: Remove data

### JSON as Data Format

JSON (JavaScript Object Notation) is the standard format for data exchange between your frontend and backend:

```json
{
  "userId": 1,
  "expenses": [
    {
      "id": 123,
      "amount": 50.75,
      "category": "Groceries",
      "date": "2025-08-01T12:00:00Z"
    }
  ]
}
```

---

## Setting Up Your Backend for Frontend Integration

### Enable CORS (Cross-Origin Resource Sharing)

Since your React app might run on a different domain/port than your Node.js backend during development, you need to enable CORS:

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all routes
app.use(cors());
// OR for more specific control:
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://yourproductionapp.com'
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies to be sent with requests
  }),
);

// Rest of your application setup...
```

**Why We Need This**: Without CORS, browsers will block requests from your React app to your Node.js server if they're on different origins (domain, port, or protocol).

### Structuring Your API Routes

Organize your routes logically for your Personal Tracker:

```javascript
// app.js or server.js
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Mount route groups
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/users', userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
  });
});

export default app;
```

**Why We Do This**: This modular structure makes your codebase easier to maintain and scale.

### Authentication Middleware Setup

You'll need to properly set up JWT authentication to protect routes:

```javascript
// Middleware to verify JWT token from frontend
export const protect = catchAsync(async (req, res, next) => {
  // Get token from header or cookie
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }

  // Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User no longer exists.', 401));
  }

  // Check if password was changed after token issued
  if (user.changePasswordAfter(decoded.iat)) {
    return next(new AppError('Password changed. Please log in again.', 401));
  }

  // Grant access
  req.user = user;
  next();
});
```

**Why This Matters**: This ensures only authenticated users can access protected resources in your API.

---

## Building Your React Frontend

### Project Structure

A clean structure for your React app:

```
frontend/
├── public/
├── src/
│   ├── api/              # API integration functions
│   ├── components/       # Reusable UI components
│   ├── context/          # Context API providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Top-level page components
│   ├── styles/           # CSS and styling
│   ├── utils/            # Helper functions and constants
│   ├── App.js            # Main component
│   └── index.js          # Entry point
└── package.json
```

### Setting Up API Integration

Create a centralized place for API calls:

```javascript
// src/api/client.js
import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api/v1' // In production, use relative path (assuming same domain)
    : 'http://localhost:5000/api/v1'; // In development, use absolute URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies with requests
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

**What's Happening Here**:

1. We create a configured axios instance
2. Add authentication token to every request automatically
3. Handle authentication errors globally

---

## Making API Calls from React to Node.js

### Creating API Service Modules

Organize API calls by feature:

```javascript
// src/api/authService.js
import apiClient from './client';

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  localStorage.removeItem('token');
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await apiClient.get(`/auth/verify-email/${token}`);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password, confirmPassword) => {
  const response = await apiClient.post(`/auth/reset-password/${token}`, {
    password,
    confirmPassword,
  });
  return response.data;
};
```

**Why This Pattern**:

- Groups related API calls together
- Makes them reusable across components
- Easier to maintain and test

### Using API Services in Components

Example of a Login component using our API service:

```jsx
// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(email, password);

      // Store token
      localStorage.setItem('token', response.token);

      // Update user context
      setUser(response.data.user);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Your Account</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="links">
        <a href="/forgot-password">Forgot Password?</a>
        <a href="/signup">Create Account</a>
      </div>
    </div>
  );
};

export default Login;
```

**Key Concepts Here**:

- Form state management using React hooks
- API call integration
- Error handling
- Loading state
- Context API for global state (user)
- Navigation after successful login

---

## Authentication Implementation

### Creating an Auth Context

Central place to store and manage authentication state:

```jsx
// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if user is already logged in
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Validate token with the backend
        const response = await apiClient.get('/auth/me');
        setUser(response.data.data.user);
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Why Use Context**:

- Provides global access to user authentication state
- Prevents prop drilling
- Centralizes auth-related logic

### Email Verification Flow

When implementing email verification, you need to coordinate between backend and frontend:

```jsx
// src/pages/EmailVerification.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/authService';

const EmailVerification = () => {
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState('pending');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        // Redirect after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="verification-container">
      <h2>Email Verification</h2>

      {verifying && (
        <div className="verification-status">
          <div className="loader"></div>
          <p>Verifying your email address...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="verification-success">
          <div className="check-mark">✓</div>
          <h3>Verification Successful!</h3>
          <p>
            Your email has been verified successfully. Redirecting to login
            page...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="verification-error">
          <div className="error-mark">✗</div>
          <h3>Verification Failed</h3>
          <p>The verification link is invalid or has expired.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
```

**How This Works**:

1. User receives verification email from the backend
2. They click the link which takes them to `/verify-email/:token` in your React app
3. React component extracts the token and calls your Node.js backend
4. Backend verifies the token and marks the user as verified
5. Frontend shows success and redirects to login

---

## Handling Protected Routes

### Creating Protected Route Component

Prevent unauthorized access to certain pages:

```jsx
// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return <Spinner />;
  }

  // Redirect to login if not authenticated
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
```

### Setting Up Routes

Use the protected route in your router setup:

```jsx
// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="verify-email/:token" element={<EmailVerification />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="expenses" element={<ExpenseList />} />
              <Route path="expenses/new" element={<AddExpense />} />
              <Route path="expenses/:id" element={<EditExpense />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
```

**How Protected Routes Work**:

1. When a user tries to access a protected route
2. The `ProtectedRoute` component checks if they're authenticated
3. If yes, they see the requested page
4. If no, they're redirected to the login page

---

## State Management in React

### Using Context API for Global State

For smaller to medium apps, Context API works well:

```jsx
// src/context/ExpenseContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../api/expenseService';
import { AuthContext } from './AuthContext';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Load expenses when component mounts
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getExpenses();
        setExpenses(data.expenses || []);
        setError(null);
      } catch (err) {
        setError('Failed to load expenses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, [user]);

  // Add new expense
  const addNewExpense = async (expenseData) => {
    try {
      const result = await addExpense(expenseData);
      setExpenses([...expenses, result.expense]);
      return result.expense;
    } catch (err) {
      setError('Failed to add expense');
      throw err;
    }
  };

  // Update existing expense
  const editExpense = async (id, expenseData) => {
    try {
      const result = await updateExpense(id, expenseData);
      setExpenses(
        expenses.map((exp) => (exp._id === id ? result.expense : exp)),
      );
      return result.expense;
    } catch (err) {
      setError('Failed to update expense');
      throw err;
    }
  };

  // Delete expense
  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter((exp) => exp._id !== id));
    } catch (err) {
      setError('Failed to delete expense');
      throw err;
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        error,
        addNewExpense,
        editExpense,
        removeExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};
```

**Usage in Components**:

```jsx
// src/pages/ExpenseList.jsx
import React, { useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import ExpenseItem from '../components/ExpenseItem';
import Spinner from '../components/Spinner';

const ExpenseList = () => {
  const { expenses, loading, error } = useContext(ExpenseContext);

  if (loading) return <Spinner />;

  if (error) return <div className="error-message">{error}</div>;

  if (expenses.length === 0) {
    return (
      <div className="no-expenses">
        <h3>No expenses found</h3>
        <p>Start tracking your expenses by adding a new expense.</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <h2>Your Expenses</h2>
      {expenses.map((expense) => (
        <ExpenseItem key={expense._id} expense={expense} />
      ))}
    </div>
  );
};

export default ExpenseList;
```

### Using Redux for Complex State Management

For larger applications, Redux provides more structure:

```jsx
// src/redux/slices/expenseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as expenseService from '../../api/expenseService';

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await expenseService.getExpenses();
      return response.expenses;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch expenses',
      );
    }
  },
);

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await expenseService.addExpense(expenseData);
      return response.expense;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create expense',
      );
    }
  },
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default expenseSlice.reducer;
```

**Redux vs Context API**:

- **Redux**: Better for complex state with many actions, or when performance is critical
- **Context API**: Simpler for small to medium apps, easier to learn and implement

---

## Deployment Considerations

### Development vs. Production

Configure your app for both environments:

```javascript
// .env.development (React)
REACT_APP_API_URL=http://localhost:5000/api/v1

// .env.production (React)
REACT_APP_API_URL=/api/v1

// config.js (Node.js)
export default {
  port: process.env.PORT || 5000,
  databaseURL: process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI
    : 'mongodb://localhost:27017/personal-tracker',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  emailFrom: process.env.EMAIL_FROM || 'noreply@personaltracker.com'
};
```

### Deployment Options

#### Option 1: Separate Deployments

Deploy backend and frontend separately:

1. **Backend**: Deploy Node.js to Heroku, Render, DigitalOcean, etc.
2. **Frontend**: Deploy React to Netlify, Vercel, GitHub Pages, etc.

Configure CORS on the backend to accept requests from your frontend domain.

#### Option 2: Combined Deployment

Deploy both as a single application:

```javascript
// In your Node.js app.js
import path from 'path';
import express from 'express';

// API routes
app.use('/api/v1/auth', authRoutes);
// ...other routes

// Serve static files from the React build folder in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, 'frontend/build')));

  // For any route not matched by the API, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}
```

---

## Common Patterns and Best Practices

### Custom Hooks for API Calls

Create reusable hooks for common API operations:

```javascript
// src/hooks/useApi.js
import { useState } from 'react';

export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};
```

**Usage**:

```jsx
import { useApi } from '../hooks/useApi';
import { getExpenseById } from '../api/expenseService';

const ExpenseDetail = ({ id }) => {
  const {
    data: expense,
    loading,
    error,
    execute: fetchExpense,
  } = useApi(getExpenseById);

  useEffect(() => {
    fetchExpense(id);
  }, [id]);

  // Render component based on loading, error, and expense state
};
```

### Intercepting API Requests and Responses

Handle authentication tokens and errors consistently:

```javascript
// src/api/client.js (expanded version)
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have necessary permissions
          console.error('Permission denied');
          break;

        case 404:
          // Not found
          console.error('Resource not found');
          break;

        case 500:
          // Server error
          console.error('Server error occurred');
          break;

        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received (network issues)
      console.error('Network error - no response received');
    } else {
      // Error in setting up the request
      console.error('Error setting up request:', error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
```

### Component Design Patterns

Use composable components to build your UI:

```jsx
// src/components/ExpenseForm.jsx
import React, { useState } from 'react';
import DatePicker from './DatePicker';
import CategorySelect from './CategorySelect';
import CurrencyInput from './CurrencyInput';

// Reusable form component for both adding and editing expenses
const ExpenseForm = ({ expense = {}, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    amount: expense.amount || '',
    category: expense.category || '',
    date: expense.date ? new Date(expense.date) : new Date(),
    description: expense.description || '',
    paymentMethod: expense.paymentMethod || 'card',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <CurrencyInput
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <CategorySelect
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <DatePicker
          id="date"
          selected={formData.date}
          onChange={handleDateChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={formData.paymentMethod === 'cash'}
              onChange={handleChange}
            />
            Cash
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={formData.paymentMethod === 'card'}
              onChange={handleChange}
            />
            Card
          </label>
        </div>
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Saving...' : expense._id ? 'Update Expense' : 'Add Expense'}
      </button>
    </form>
  );
};

export default ExpenseForm;
```

**Usage**:

```jsx
// src/pages/AddExpense.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '../components/ExpenseForm';
import { ExpenseContext } from '../context/ExpenseContext';
import { useApi } from '../hooks/useApi';
import { addExpense } from '../api/expenseService';

const AddExpense = () => {
  const navigate = useNavigate();
  const { loading, execute: createExpense } = useApi(addExpense);

  const handleSubmit = async (formData) => {
    try {
      await createExpense(formData);
      navigate('/expenses');
    } catch (err) {
      // Error is handled by useApi hook
    }
  };

  return (
    <div className="add-expense-container">
      <h2>Add New Expense</h2>
      <ExpenseForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default AddExpense;
```

---

## Troubleshooting

### Common Issues and Solutions

#### CORS Errors

**Problem**: "Access to XMLHttpRequest at 'http://localhost:5000/api/v1/auth/login' has been blocked by CORS policy"

**Solution**:

- Ensure CORS is properly configured on your backend:
  ```javascript
  import cors from 'cors';
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  ```
- If using a proxy in `package.json`, make sure API calls use relative URLs (e.g., `/api/v1/auth/login` instead of `http://localhost:5000/api/v1/auth/login`)

#### Authentication Issues

**Problem**: JWT token is not being sent with requests

**Solution**:

- Check that the token is being stored properly in localStorage
- Verify the token is being added to request headers
- Ensure the token format is correct (`Bearer <token>`)

#### API Connection Problems

**Problem**: "Failed to fetch" or "Network Error"

**Solution**:

- Confirm both servers are running
- Check for typos in API URLs
- Verify that environment variables are set correctly
- Test API endpoints using a tool like Postman

#### State Management Challenges

**Problem**: Component not updating when state changes

**Solution**:

- Use React DevTools to inspect component props and state
- Verify that state updates are being handled correctly
- Check for missing dependencies in useEffect
- Ensure context providers are properly wrapping components that need access

---

## Conclusion

Connecting a Node.js backend to a React frontend involves several key components:

1. **Setting up CORS** on the backend to allow requests from the frontend
2. **Creating RESTful API endpoints** in Node.js
3. **Making HTTP requests** from React using Axios or Fetch
4. **Managing authentication** with JWT tokens
5. **Handling global state** with Context API or Redux
6. **Implementing protected routes** to secure parts of your application

By following the patterns and examples in this guide, you'll be able to create a robust full-stack application that provides a great user experience while maintaining security and performance.

Remember that the most important part of any full-stack application is consistent error handling and proper authentication. Focus on getting these right, and the rest will follow.

Happy coding!
