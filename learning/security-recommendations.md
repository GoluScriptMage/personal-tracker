# Security Recommendations for Your Personal Tracker App

## Overview

Based on reviewing your code, you've already implemented several good security practices:

✅ Using JWT for authentication
✅ Password hashing with bcrypt
✅ Email verification flow
✅ Route protection middleware
✅ HTTP-only cookies for tokens
✅ Helmet for HTTP headers
✅ Role-based access control

However, there are some important security enhancements you could add to make your application more secure. Here are practical recommendations that match your current knowledge level.

## 1. Input Validation & Sanitization

### Current Status:

You're using Mongoose validation for some inputs, but there's no comprehensive validation for API inputs.

### Recommendation:

Use [express-validator](https://express-validator.github.io/docs/) to validate and sanitize all user inputs.

```javascript
// Install the package
// npm install express-validator

// In your route file (authRoutes.js)
import { body, validationResult } from 'express-validator';

// Add validation middleware
router.post(
  '/signup',
  [
    // Validate email
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(), // Sanitize email

    // Validate password
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
  ],
  // Validation check middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  signup,
);
```

## 2. Rate Limiting

### Current Status:

No rate limiting implemented, which could make your app vulnerable to brute force attacks.

### Recommendation:

Add [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) to prevent too many requests from the same IP.

```javascript
// Install the package
// npm install express-rate-limit

// In your app.js
import rateLimit from 'express-rate-limit';

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per IP
  message: 'Too many login attempts, please try again after 15 minutes',
});

// Apply to specific routes that need protection
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
```

## 3. Parameter Pollution Protection

### Current Status:

No protection against parameter pollution attacks.

### Recommendation:

Use [hpp](https://www.npmjs.com/package/hpp) to protect against HTTP Parameter Pollution attacks.

```javascript
// Install the package
// npm install hpp

// In your app.js
import hpp from 'hpp';

// Use after body parser middleware
app.use(
  hpp({
    whitelist: ['amount', 'category', 'date', 'sortBy', 'limit', 'page'],
  }),
);
```

## 4. MongoDB Injection Protection

### Current Status:

While using Mongoose provides some protection, additional safeguards can help.

### Recommendation:

Always use Mongoose methods properly and avoid using `$where` operators with user input.

```javascript
// UNSAFE - Don't do this:
const userQuery = { $where: `this.email === '${req.body.email}'` };

// SAFE - Do this instead:
const userQuery = { email: req.body.email };
```

Also, ensure that IDs are valid before querying:

```javascript
// Add this validation for all ID parameters
import mongoose from 'mongoose';

// In your controller function
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return next(new AppError('Invalid ID format', 400));
}
```

## 5. XSS Protection

### Current Status:

You're using Helmet which helps, but additional measures would be beneficial.

### Recommendation:

Use a package like [xss-clean](https://www.npmjs.com/package/xss-clean) to sanitize user input.

```javascript
// Install the package
// npm install xss-clean

// In your app.js
import xss from 'xss-clean';

// Use after body parser middleware
app.use(xss());
```

## 6. Security Headers Enhancement

### Current Status:

Using Helmet for basic security headers.

### Recommendation:

Configure Helmet more specifically for your application:

```javascript
// In your app.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  }),
);
```

## 7. JWT Best Practices

### Current Status:

Basic JWT implementation is good, but could be enhanced.

### Recommendation:

Improve your JWT implementation:

1. Use short expiration times for tokens
2. Implement token refresh mechanism
3. Store token ID in a blacklist when users log out

```javascript
// In your authController.js

// Use shorter expiration
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  expiresIn: '1h', // Short-lived token
});

// When user logs out
export const logout = catchAsync(async (req, res, next) => {
  // Get token from request
  const token = req.headers.authorization.split(' ')[1];

  // Add token to blacklist (could be stored in Redis or DB)
  // For simplicity, we're just invalidating the cookie here
  res.cookie('jwt', 'logged-out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
});
```

## 8. Error Handling Improvements

### Current Status:

Good error handling with custom error class, but could leak sensitive information.

### Recommendation:

Ensure errors don't leak sensitive data in production:

```javascript
// In your errorController.js
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for developers
    console.error('ERROR 💥', err);

    // Send generic message to client
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Make a copy of the error to avoid modifying the original
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types here
    // e.g., Mongoose validation errors, etc.

    sendErrorProd(error, res);
  }
};
```

## 9. Data Validation in Models

### Current Status:

Basic validation in Mongoose schemas.

### Recommendation:

Add more validation to your expense model:

```javascript
// In expenseModel.js
const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'food',
        'transportation',
        'entertainment',
        'shopping',
        'utilities',
        'housing',
        'healthcare',
        'other',
      ],
      message: 'Category is not valid',
    },
  },
  // Other fields...
});
```

## 10. API Security Best Practices

### Current Status:

Basic API structure is good, but could be improved.

### Recommendation:

1. **Implement proper request size limits**:

```javascript
// In app.js
app.use(express.json({ limit: '10kb' })); // Limit request body size
```

2. **Set secure and SameSite cookie attributes**:

```javascript
// In authController.js
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
  httpOnly: true,
  sameSite: 'strict', // Helps prevent CSRF attacks
};

if (process.env.NODE_ENV === 'production') {
  cookieOptions.secure = true;
}
```

3. **Add security-related environment variables**:

```
# In your .config.env file
NODE_ENV=development
PORT=3001
MONGODB_URL=mongodb+srv://...
MONGODB_PASSWORD=yourpassword
JWT_SECRET=your-very-long-and-secure-secret-key-here-at-least-32-characters
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EMAIL_FROM=noreply@personaltracker.com
CLIENT_URL=http://localhost:3173
```

## Implementation Priority

If you want to start implementing these recommendations, here's a suggested order of priority:

1. **Input Validation & Sanitization** - Most critical to prevent injection attacks
2. **Rate Limiting** - Quick win to prevent brute force attacks
3. **Error Handling Improvements** - Ensures no sensitive data leaks in production
4. **JWT Best Practices** - Improves your authentication security
5. **XSS Protection** - Prevents cross-site scripting attacks

The other recommendations can be implemented as you continue to improve your application.

## Learning Resources

To learn more about web application security, check out these resources:

1. [OWASP Top 10](https://owasp.org/www-project-top-ten/) - The standard awareness document for developers about the most critical security risks
2. [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) - Official Express.js security guide
3. [Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) - OWASP's Node.js security recommendations

Remember, security is an ongoing process, not a one-time implementation. Regularly reviewing and updating your security measures is essential for maintaining a secure application.
