# Connecting Node.js Backend to React Frontend: A Practical Guide

## 🔄 How it Works: The Big Picture

```
┌─────────────────┐                        ┌─────────────────┐
│                 │                        │                 │
│  React Frontend │                        │  Node.js Backend│
│  (Browser)      │                        │  (Server)       │
│                 │                        │                 │
└────────┬────────┘                        └────────┬────────┘
         │                                          │
         │        1. HTTP Request                   │
         │ ─────────────────────────────────────>  │
         │        GET /api/expenses                 │
         │                                          │
         │        2. Process Request                │
         │        ┌─────────────────┐              │
         │        │ Authenticate    │              │
         │        │ Validate        │              │
         │        │ Fetch Data      │              │
         │        └─────────────────┘              │
         │                                          │
         │        3. HTTP Response                  │
         │ <─────────────────────────────────────  │
         │        {data: [...expenses]}             │
         │                                          │
┌────────┴────────┐                        ┌────────┴────────┐
│                 │                        │                 │
│  Update UI with │                        │    Database     │
│  received data  │                        │                 │
│                 │                        │                 │
└─────────────────┘                        └─────────────────┘
```

Think of it like a restaurant:

- **React (Frontend)**: The dining area where customers interact
- **Node.js (Backend)**: The kitchen where food is prepared
- **API Endpoints**: The waitstaff carrying orders and food
- **Database**: The pantry where ingredients are stored

## 🛠️ Setting Up Your Backend for Frontend Access

### 1. Enable CORS (Cross-Origin Resource Sharing)

Without CORS, your frontend can't talk to your backend if they're on different domains/ports.

```javascript
// app.js
import express from 'express';
import cors from 'cors';

const app = express();

// Allow requests from your React app
app.use(
  cors({
    origin: 'http://localhost:3000', // Your React app's address
    credentials: true, // Allow cookies to be sent
  }),
);

// Now your React app can talk to this server!
```

💡 **Real-world analogy**: CORS is like the security guard at a building. Without proper authorization (CORS headers), visitors (requests) from other buildings (domains) are turned away.

### 2. Create Clear API Endpoints

```javascript
// routes/expenseRoutes.js
import express from 'express';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// All routes below this middleware require authentication
router.use(protect);

router
  .route('/')
  .get(getExpenses) // GET /api/v1/expenses → List all expenses
  .post(addExpense); // POST /api/v1/expenses → Create new expense

router
  .route('/:id')
  .get(getExpenseById) // GET /api/v1/expenses/123 → Get one expense
  .patch(updateExpense) // PATCH /api/v1/expenses/123 → Update expense
  .delete(deleteExpense); // DELETE /api/v1/expenses/123 → Delete expense

export default router;
```

💡 **Why structure matters**: Good organization makes your code easier to maintain as your app grows. Think of it like organizing a filing cabinet versus throwing everything in a drawer.

## 🔌 Building Your React Frontend

### 1. Set Up API Communication

Create a central place to handle API calls:

```javascript
// src/api/client.js
import axios from 'axios';

// Create a pre-configured axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Your backend address
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Add authentication to every request
apiClient.interceptors.request.use((request) => {
  const token = localStorage.getItem('token');

  if (token) {
    // Add token to request headers
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

export default apiClient;
```

💡 **Think of it like**: Setting up a dedicated phone line between your frontend and backend with automatic caller ID (authentication).

### 2. Create Service Functions for API Calls

Group related API calls together:

```javascript
// src/services/expenseService.js
import apiClient from '../api/client';

// Get all expenses
export const getExpenses = async () => {
  const response = await apiClient.get('/expenses');
  return response.data;
};

// Create a new expense
export const createExpense = async (expenseData) => {
  const response = await apiClient.post('/expenses', expenseData);
  return response.data;
};

// More functions for update, delete, etc.
```

💡 **Why this approach**: Centralizing API calls makes your code more maintainable. If your backend URL changes, you only need to update it in one place.

## 🔐 Authentication Flow

Here's how authentication typically works between React and Node.js:

```
┌─────────────┐                           ┌─────────────┐
│   React     │                           │   Node.js   │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │  1. Login Request                       │
       │ ────────────────────────────────────>  │
       │    {email, password}                    │
       │                                         │
       │                                         │  2. Verify Credentials
       │                                         │  ┌─────────────────┐
       │                                         │  │ Check email     │
       │                                         │  │ Verify password │
       │                                         │  └─────────────────┘
       │                                         │
       │  3. Send JWT Token                      │
       │ <────────────────────────────────────  │
       │    {token: "eyJhbGciOi..."}             │
       │                                         │
       │  4. Store Token                         │
       │  ┌─────────────┐                        │
       │  │localStorage │                        │
       │  └─────────────┘                        │
       │                                         │
       │  5. Request Protected Resource          │
       │ ────────────────────────────────────>  │
       │    Headers: {Authorization: Bearer xyz} │
       │                                         │
       │                                         │  6. Verify Token
       │                                         │  ┌─────────────────┐
       │                                         │  │ Check signature │
       │                                         │  │ Verify not expired│
       │                                         │  └─────────────────┘
       │                                         │
       │  7. Send Protected Data                 │
       │ <────────────────────────────────────  │
       │    {data: [...]}                        │
       │                                         │
```

### Example Login Implementation:

```jsx
// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // AuthContext handles the API call and token storage
      await login(email, password);
      navigate('/dashboard'); // Redirect on success
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields omitted for brevity */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};
```

💡 **Think of JWT like**: A VIP wristband at a concert. Once you get it at entry (login), you can use it to access restricted areas (protected routes) without showing your ID again.

## 🔒 Protecting Routes in React

Keep unauthorized users away from certain pages:

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // User is logged in, show the protected content
  return children;
};

// Usage in your router:
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

💡 **Real-world analogy**: Think of protected routes as VIP areas in a venue. The bouncer (ProtectedRoute) checks if you have a wristband (auth token) before letting you in.

## 🗃️ Managing State in React

### Simple Global State with Context API

For most apps, the Context API is sufficient:

```jsx
// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getCurrentUser()
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login function used by components
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to auth context
export const useAuth = () => useContext(AuthContext);
```

💡 **Think of Context like**: A family sharing plan. Everyone in the family (components) can access the same subscription (state) without having to pass it around explicitly.

## 📱 Example: Full Data Flow for Expenses

Here's how all the pieces work together:

1. **Setting up the expense context**:

```jsx
// src/context/ExpenseContext.jsx
import { createContext, useState, useContext } from 'react';
import expenseService from '../services/expenseService';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all expenses
  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new expense
  const addExpense = async (expenseData) => {
    try {
      const newExpense = await expenseService.createExpense(expenseData);
      setExpenses([...expenses, newExpense]);
      return newExpense;
    } catch (error) {
      console.error('Failed to add expense', error);
      throw error;
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        loadExpenses,
        addExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);
```

2. **Using the context in a component**:

```jsx
// src/pages/Dashboard.jsx
import { useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { expenses, loading, loadExpenses } = useExpenses();

  // Load expenses when component mounts
  useEffect(() => {
    loadExpenses();
  }, []);

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <h2>Your Expenses</h2>

      {expenses.length === 0 ? (
        <p>No expenses found. Add your first expense!</p>
      ) : (
        <ul>
          {expenses.map((expense) => (
            <li key={expense._id}>
              {expense.description}: ${expense.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

3. **Adding a new expense**:

```jsx
// src/components/AddExpenseForm.jsx
import { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';

const AddExpenseForm = ({ onSuccess }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const { addExpense } = useExpenses();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addExpense({
        description,
        amount: Number(amount),
        date: new Date(),
      });

      // Reset form
      setDescription('');
      setAmount('');

      // Call success callback (e.g., to show notification)
      if (onSuccess) onSuccess();
    } catch (error) {
      // Handle error (show error message, etc.)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Expense description"
        required
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        min="0.01"
        step="0.01"
        required
      />
      <button type="submit">Add Expense</button>
    </form>
  );
};
```

## 🔄 Email Verification Flow

Here's how email verification works between your frontend and backend:

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────┐
│                 │          │                 │          │             │
│  React Frontend │          │  Node.js Backend│          │   User's    │
│                 │          │                 │          │   Email     │
└────────┬────────┘          └────────┬────────┘          └──────┬──────┘
         │                            │                          │
         │ 1. User signs up           │                          │
         │ ─────────────────────────> │                          │
         │                            │                          │
         │                            │ 2. Generate verify token │
         │                            │ ──────────────────┐      │
         │                            │                   │      │
         │                            │ <─────────────────┘      │
         │                            │                          │
         │                            │ 3. Send verification email
         │                            │ ─────────────────────────>
         │                            │                          │
         │                            │                          │
         │                            │                          │
         │                            │                          │
         │                            │                          │
         │                            │                          │
┌────────┴────────┐          ┌────────┴────────┐          ┌──────┴──────┐
│                 │          │                 │          │             │
│                 │          │                 │          │ 4. User     │
│                 │          │                 │          │ clicks link │
└────────┬────────┘          └────────┬────────┘          └──────┬──────┘
         │                            │                          │
         │                            │                          │
         │                            │ 5. GET /verify/:token    │
         │                            │ <─────────────────────────
         │                            │                          │
         │                            │ 6. Verify token & update │
         │                            │ user status              │
         │                            │ ──────────────────┐      │
         │                            │                   │      │
         │                            │ <─────────────────┘      │
         │                            │                          │
         │ 7. Redirect to login       │                          │
         │ <─────────────────────────────────────────────────────┘
         │ with success message       │                          │
```

### Backend Implementation:

```javascript
// controllers/authController.js

// Send verification email
export const sendVerificationEmail = catchAsync(async (req, res, next) => {
  const user = req.user;

  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash token before saving (security best practice)
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Save to user
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify/${verificationToken}`;

  // Send email
  await sendEmail({
    email: user.email,
    subject: 'Verify your email',
    message: `Click here to verify your email: ${verificationURL}`,
  });

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent!',
  });
});

// Verify email with token
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Hash token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with this token that hasn't expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update user
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Redirect to frontend (for email link clicks)
  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});
```

💡 **Email verification is like**: Confirming your address when you move. The service sends a letter with a special code, and you verify you live there by using that code.

## 🚀 Deployment Strategies

### Option 1: Separate Deployments (Recommended for beginners)

```
┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │
│  React Frontend │──HTTP───>│  Node.js Backend│
│  (Netlify)      │  calls   │  (Heroku)       │
│                 │          │                 │
└─────────────────┘          └─────────────────┘
```

**Pros:**

- Easier to deploy separately
- Can scale frontend and backend independently
- Clear separation of concerns

**Setup:**

1. Deploy React to Netlify/Vercel
2. Deploy Node.js to Heroku/Render
3. Set environment variables for API URLs

### Option 2: Combined Deployment

```
┌─────────────────────────────────────┐
│                                     │
│  Node.js Server                     │
│  ┌─────────────┐   ┌─────────────┐  │
│  │ API Routes  │   │ Static      │  │
│  │ /api/*      │   │ React Files │  │
│  └─────────────┘   └─────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Pros:**

- Single deployment
- Simpler production setup
- No CORS issues

**Setup in Node.js:**

```javascript
// Serve API routes
app.use('/api/v1', apiRoutes);

// In production, serve React build files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
```

💡 **Think of deployment like**: Opening a restaurant. You can either have the kitchen (backend) and dining area (frontend) in the same building (combined deployment) or have a separate kitchen that delivers to multiple dining locations (separate deployments).

## 🧰 Common Patterns You'll Use

### 1. Custom Hooks for API Calls

```javascript
// src/hooks/useApi.js
import { useState } from 'react';

export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
}

// Usage example
const MyComponent = () => {
  const {
    data: expenses,
    loading,
    execute: fetchExpenses,
  } = useApi(expenseService.getExpenses);

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Rest of component...
};
```

💡 **Custom hooks are like**: Creating your own specialized tools for a job instead of using generic ones. They make your code cleaner and more reusable.

### 2. Form Handling with Controlled Components

```jsx
// src/components/ExpenseForm.jsx
import { useState } from 'react';

const ExpenseForm = ({ onSubmit }) => {
  // Single state object for all form fields
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date(),
  });

  // Handle change for all text/select inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
};
```

## 🔍 Common Issues & Solutions

### 1. CORS Errors

**Problem**: `Access to XMLHttpRequest at 'http://localhost:5000/api' has been blocked by CORS policy`

**Solution**:

```javascript
// Backend (Node.js)
import cors from 'cors';
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
```

### 2. Authentication Issues

**Problem**: Protected routes not recognizing logged-in user

**Solution**: Ensure your token is:

1. Being stored correctly (`localStorage.setItem('token', token)`)
2. Being sent with requests (`headers.Authorization = Bearer ${token}`)
3. Being verified correctly on the backend

### 3. Component Re-rendering Issues

**Problem**: Component re-renders too often or doesn't update when data changes

**Solution**: Use the React DevTools to debug component renders and check your dependency arrays in useEffect

```jsx
// Wrong way (re-renders too often)
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData is recreated every render

// Correct way
useEffect(() => {
  fetchData();
}, []); // Only runs once on mount

// Or with proper dependencies
const { id } = props;
useEffect(() => {
  fetchData(id);
}, [id]); // Only runs when id changes
```

## 🎓 Conclusion

Connecting your Node.js backend to React involves:

1. **Setting up your backend** with proper CORS and API endpoints
2. **Creating API services** in your React app
3. **Managing authentication** with JWT tokens
4. **Using context or Redux** for global state
5. **Implementing protected routes** for security

Remember:

- Start small and build incrementally
- Use the browser's developer tools to debug API calls
- Keep your authentication logic clean and centralized
- Test your API endpoints independently before integrating

By following these patterns, you'll create a robust full-stack application that's maintainable and scalable.

Happy coding!
